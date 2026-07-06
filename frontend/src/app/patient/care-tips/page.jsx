"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  Smile, 
  Flame, 
  Heart, 
  ClipboardList,
  AlertCircle,
  HelpCircle,
  Calendar,
  User
} from 'lucide-react';
import { getOralHealthDetails, getPatientProfile, getPatientTreatmentPlan } from '@/services/api';

export default function CareTipsPage() {
  const [healthDetails, setHealthDetails] = useState(null);
  const [activePlan, setActivePlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const details = await getOralHealthDetails();
        setHealthDetails(details);
      } catch (err) {
        console.error("Failed to load health details:", err);
      }

      try {
        const profile = await getPatientProfile();
        if (profile?.token) {
          const plans = await getPatientTreatmentPlan(profile.token);
          const active = plans.find(p => p.status === "Active");
          setActivePlan(active || null);
        }
      } catch (err) {
        console.error("Failed to load treatment plan for tips:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const getStepGuidelines = (step) => {
    const title = (step.title || "").toLowerCase();
    const details = step.details || "";
    const notes = step.notes || "";
    
    let guidelines = [];
    if (details) guidelines.push(details);
    if (notes) guidelines.push(notes);
    
    // Clinical fallbacks based on keywords
    if (title.includes("root canal") || title.includes("rct") || title.includes("endodontic")) {
      guidelines.push(
        "Avoid chewing on the treated side until the permanent restoration/crown is placed.",
        "Mild soreness is expected for 2-3 days; take prescribed anti-inflammatory medicine as needed.",
        "Ensure gentle but thorough brushing and flossing around the tooth."
      );
    } else if (title.includes("extraction") || title.includes("surgical") || title.includes("wisdom") || title.includes("removal")) {
      guidelines.push(
        "Bite firmly on the gauze pack for 45 minutes to control bleeding.",
        "Do not rinse, spit, drink through a straw, or smoke for at least 24 hours.",
        "Apply an ice pack to the side of your face for 10 minutes at a time to reduce swelling.",
        "Eat soft, cool foods today and drink plenty of fluids."
      );
    } else if (title.includes("scaling") || title.includes("cleaning") || title.includes("polishing") || title.includes("hygiene")) {
      guidelines.push(
        "Avoid hot, cold, or highly acidic food/beverages if your teeth feel sensitive.",
        "Use a desensitizing toothpaste if tooth sensitivity persists beyond 48 hours.",
        "Rinse with warm salt water (1/2 tsp salt in 1 cup water) if your gums are tender."
      );
    } else if (title.includes("filling") || title.includes("composite") || title.includes("restoration") || title.includes("cavity")) {
      guidelines.push(
        "Avoid eating or drinking hot fluids until the local anesthesia has completely worn off.",
        "It is normal to feel slight sensitivity to cold or pressure for a few days."
      );
    } else if (title.includes("ortho") || title.includes("braces") || title.includes("brackets") || title.includes("aligners")) {
      guidelines.push(
        "Avoid hard, sticky, or chewy foods (like caramel, nuts, or popcorn) that can break brackets.",
        "Use a threader or interdental brush to thoroughly clean around wires and braces daily.",
        "Wear orthodontic wax over brackets causing irritation to your lips or cheeks."
      );
    } else if (title.includes("crown") || title.includes("bridge") || title.includes("prosthetic") || title.includes("fitting")) {
      guidelines.push(
        "Avoid sticky foods (like chewing gum or sticky candy) that might pull the temporary crown off.",
        "When flossing, slide the floss out from the side rather than pulling it up to prevent dislodging."
      );
    }
    
    // De-duplicate guidelines
    return Array.from(new Set(guidelines));
  };

  const generalTips = [
    {
      title: "Brush Twice Daily",
      desc: "Brush for at least 2 minutes using fluoride toothpaste and a soft-bristled brush. Hold at a 45-degree angle.",
      icon: <Smile className="w-6 h-6 text-primary" />,
      color: "bg-blue-50 border-blue-100"
    },
    {
      title: "Floss Nightly",
      desc: "Clean between your teeth every night to remove plaque and food particles that your toothbrush can't reach.",
      icon: <ShieldCheck className="w-6 h-6 text-green-600" />,
      color: "bg-green-50 border-green-100"
    },
    {
      title: "Stay Hydrated",
      desc: "Water helps wash away sugars and acids. It also promotes healthy saliva production, which naturally protects teeth.",
      icon: <Heart className="w-6 h-6 text-pink-500" />,
      color: "bg-pink-50 border-pink-100"
    },
    {
      title: "Limit Sugary Foods",
      desc: "Reduce snacks and drinks high in processed sugar to starve cavity-causing bacteria and preserve enamel.",
      icon: <Flame className="w-6 h-6 text-amber-500" />,
      color: "bg-amber-50 border-amber-100"
    }
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12 animate-fade-in text-left">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/patient/notifications"
          className="p-2 bg-white rounded-xl border border-gray-150 shadow-sm text-gray-500 hover:text-primary transition-all hover:scale-105 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Dental Care & Guidelines <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
          </h1>
          <p className="text-sm text-gray-500">Personalized post-treatment instructions and general hygiene tips.</p>
        </div>
      </div>

      {/* Dynamic Treatment Post-Care Section */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-primary/5 to-indigo-50/20 flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-2xl border border-primary/20 text-primary">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Active Treatment Plan Post-Care</h2>
            <p className="text-xs text-gray-550">Dynamic guidelines matching your active dental procedures</p>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center">
              <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-gray-400">Fetching treatment guidelines...</p>
            </div>
          ) : activePlan && activePlan.steps && activePlan.steps.length > 0 ? (
            <div className="space-y-6">
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4 flex gap-3 items-start">
                <AlertCircle className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-indigo-800">Active Treatment Details</h4>
                  <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed flex items-center gap-1.5 flex-wrap">
                    <span>Plan: <strong>{activePlan.diagnosis || "Active treatment plan"}</strong></span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" /> Attending: <strong>{activePlan.doctor_name}</strong></span>
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {activePlan.steps.map((step, idx) => {
                  const guidelines = getStepGuidelines(step);
                  if (guidelines.length === 0) return null;
                  
                  return (
                    <div key={step.id || idx} className="border border-gray-150 rounded-2xl p-5 bg-white shadow-2xs hover:border-primary/20 transition-all">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
                        <span className="text-sm font-bold text-gray-900 flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] flex items-center justify-center font-bold">{idx + 1}</span>
                          {step.title}
                        </span>
                        <span className="text-[10px] font-black uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                          {step.status}
                        </span>
                      </div>
                      
                      <ul className="space-y-2">
                        {guidelines.map((guide, gIdx) => (
                          <li key={gIdx} className="text-xs text-gray-600 flex items-start gap-2 leading-relaxed">
                            <span className="text-primary mt-1">•</span>
                            <span>{guide}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
                {activePlan.steps.every(s => getStepGuidelines(s).length === 0) && (
                  <div className="text-center py-6 text-gray-400 text-xs italic">
                    No active guidelines for this plan's steps.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-gray-250 rounded-3xl">
              <HelpCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-gray-700">No Active Treatment Instructions</h3>
              <p className="text-xs text-gray-450 mt-1 max-w-xs mx-auto">
                We couldn't detect an active treatment plan for your account. Standard daily care guidelines apply.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* General Dental Care Tips Section */}
      <div>
        <h2 className="text-base font-bold text-gray-900 uppercase tracking-wider mb-4">Daily Dental Care Guidelines</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {generalTips.map((tip, idx) => (
            <div 
              key={idx} 
              className={`rounded-2xl border p-5 flex gap-4 items-start shadow-sm transition-all hover:scale-[1.01] ${tip.color}`}
            >
              <div className="bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm shrink-0">
                {tip.icon}
              </div>
              <div>
                <h3 className="text-sm font-bold text-gray-900">{tip.title}</h3>
                <p className="text-xs text-gray-600 mt-1.5 leading-relaxed font-medium">{tip.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
