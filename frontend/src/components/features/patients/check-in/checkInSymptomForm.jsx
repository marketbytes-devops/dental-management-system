"use client";

import { useState } from "react";
import { AlertTriangle, Check, Thermometer, ShieldAlert, Clock, MapPin } from "lucide-react";

export default function CheckInSymptomForm({ onSubmit, onBack }) {
  const [primaryReason, setPrimaryReason] = useState("toothache");
  const [painLevel, setPainLevel] = useState(3);
  const [painCharacter, setPainCharacter] = useState("throbbing");
  const [duration, setDuration] = useState("2_3_days");
  const [affectedArea, setAffectedArea] = useState("lower_right");
  const [selectedSymptoms, setSelectedSymptoms] = useState(["sensitivity"]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);

  const symptomOptions = [
    { id: "sensitivity", label: "Sensitivity to Hot / Cold" },
    { id: "bleeding", label: "Bleeding or Sore Gums" },
    { id: "swelling", label: "Facial / Gum Swelling" },
    { id: "jaw_pain", label: "Jaw Pain / Click when Chewing" },
    { id: "broken_tooth", label: "Broken / Chipped Tooth" },
    { id: "loose_tooth", label: "Loose Crown / Filling" },
    { id: "bad_breath", label: "Bad Taste / Odor" },
    { id: "night_grinding", label: "Teeth Grinding (Bruxism)" }
  ];

  const handleSymptomToggle = (id) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      primaryReason,
      painLevel,
      painCharacter,
      duration,
      affectedArea,
      symptoms: selectedSymptoms,
      additionalNotes,
      isEmergency,
    });
  };

  const getPainLevelColor = (level) => {
    if (level === 0) return "text-gray-400 font-semibold";
    if (level <= 3) return "text-emerald-600 font-bold";
    if (level <= 7) return "text-amber-600 font-bold";
    return "text-rose-600 font-black";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Thermometer className="w-5 h-5 text-primary" />
          Dental Problems Screening Questionnaire
        </h3>
        <p className="text-xs text-gray-500">
          Answer a few quick questions regarding your dental concerns so our doctor and clinical team can triage your visit without delay.
        </p>
      </div>

      {/* 1. Primary Dental Issue */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
          1. What is your chief dental complaint today?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: "toothache", label: "Toothache / Pain" },
            { id: "cleaning", label: "Routine Cleaning" },
            { id: "gum_issue", label: "Gum Problems" },
            { id: "crown_filling", label: "Crown / Filling" },
            { id: "braces", label: "Orthodontic Check" },
            { id: "extraction", label: "Tooth Extraction" },
            { id: "whitening", label: "Cosmetic / Whitening" },
            { id: "consultation", label: "General Checkup" },
          ].map((reason) => (
            <button
              key={reason.id}
              type="button"
              onClick={() => setPrimaryReason(reason.id)}
              className={`p-2.5 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                primaryReason === reason.id
                  ? "border-primary bg-primary/10 text-primary shadow-sm"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {reason.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Pain Scale & Character */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-gray-150">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              2. Pain Scale (0-10)
            </label>
            <span className={`text-xs ${getPainLevelColor(painLevel)}`}>
              {painLevel === 0 ? "No Pain (0)" : `${painLevel}/10`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            value={painLevel}
            onChange={(e) => setPainLevel(parseInt(e.target.value, 10))}
            className="w-full accent-primary h-2 bg-gray-200 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-400 font-bold">
            <span>None (0)</span>
            <span>Mild (3)</span>
            <span>Moderate (6)</span>
            <span>Severe (10)</span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
            Nature of Pain
          </label>
          <select
            value={painCharacter}
            onChange={(e) => setPainCharacter(e.target.value)}
            className="w-full p-2.5 text-xs font-bold border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <option value="none">No Active Pain</option>
            <option value="throbbing">Throbbing / Pulsating</option>
            <option value="sharp">Sharp / Piercing</option>
            <option value="dull">Dull Ache</option>
            <option value="chewing">Pain Only When Chewing</option>
          </select>
        </div>
      </div>

      {/* 3. Duration & Location */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-gray-400" />
            3. How long have you had this issue?
          </label>
          <select
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full p-2.5 text-xs font-bold border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <option value="less_24_hrs">Less than 24 Hours</option>
            <option value="2_3_days">2 - 3 Days</option>
            <option value="1_week">About 1 Week</option>
            <option value="more_month">More than 1 Month</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-gray-400" />
            4. Affected Tooth / Quadrant
          </label>
          <select
            value={affectedArea}
            onChange={(e) => setAffectedArea(e.target.value)}
            className="w-full p-2.5 text-xs font-bold border border-gray-200 rounded-xl bg-gray-50 focus:ring-2 focus:ring-primary/20 outline-none"
          >
            <option value="upper_right">Upper Right Quadrant</option>
            <option value="upper_left">Upper Left Quadrant</option>
            <option value="lower_right">Lower Right Quadrant</option>
            <option value="lower_left">Lower Left Quadrant</option>
            <option value="front_teeth">Front Upper/Lower Teeth</option>
            <option value="entire_mouth">Entire Mouth / Generalized</option>
          </select>
        </div>
      </div>

      {/* 5. Specific Symptoms Checklist */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
          5. Select any active symptoms:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {symptomOptions.map((symptom) => {
            const isChecked = selectedSymptoms.includes(symptom.id);
            return (
              <button
                key={symptom.id}
                type="button"
                onClick={() => handleSymptomToggle(symptom.id)}
                className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all text-xs font-semibold cursor-pointer ${
                  isChecked
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-all ${
                    isChecked
                      ? "border-primary bg-primary text-white"
                      : "border-gray-300 bg-white"
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3" />}
                </div>
                {symptom.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
          6. Additional Notes for the Attending Doctor (Optional)
        </label>
        <textarea
          rows={2}
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="e.g., Sensitive to cold water, history of high blood pressure..."
          className="w-full p-3 text-xs font-semibold border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder-gray-400 bg-gray-50"
        />
      </div>

      {/* Emergency Flag */}
      <div className="flex items-center justify-between p-3.5 bg-rose-50 border border-rose-200 rounded-2xl">
        <div className="space-y-0.5">
          <span className="text-xs font-extrabold text-rose-700 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-rose-600" />
            Is this an Acute Dental Emergency?
          </span>
          <p className="text-[11px] text-rose-600 font-medium">
            (Severe trauma, uncontrollable bleeding, high fever, facial swelling)
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={isEmergency}
            onChange={(e) => setIsEmergency(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-10 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
        </label>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
        >
          Back
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 shadow-md shadow-primary/20 transition-all cursor-pointer"
        >
          Proceed to Consultation Payment →
        </button>
      </div>
    </form>
  );
}

