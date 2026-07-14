"use client";

import { useState } from "react";
import { AlertTriangle, Check } from "lucide-react";

export default function CheckInSymptomForm({ onSubmit, onBack }) {
  const [primaryReason, setPrimaryReason] = useState("routine");
  const [painLevel, setPainLevel] = useState(0);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);

  const symptomOptions = [
    { id: "sensitivity", label: "Sensitivity to Hot/Cold" },
    { id: "bleeding", label: "Bleeding Gums" },
    { id: "swelling", label: "Swollen or Sore Gums" },
    { id: "jaw_pain", label: "Jaw Pain / Clicking" },
    { id: "broken_tooth", label: "Broken / Chipped Tooth" },
    { id: "loose_tooth", label: "Loose Tooth" },
    { id: "bad_breath", label: "Persistent Bad Breath" },
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
      symptoms: selectedSymptoms,
      additionalNotes,
      isEmergency,
    });
  };

  const getPainLevelColor = (level) => {
    if (level === 0) return "text-gray-400";
    if (level <= 3) return "text-success font-semibold";
    if (level <= 7) return "text-warning font-semibold";
    return "text-danger font-bold";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-xl font-bold text-gray-900">Symptom Assessment</h3>
        <p className="text-sm text-gray-500">
          Please provide details about your current symptoms to help us prepare for your visit.
        </p>
      </div>

      {/* Primary Reason */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700 block">
          Primary Reason for Visit
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: "routine", label: "Routine Checkup" },
            { id: "cleaning", label: "Cleaning" },
            { id: "pain", label: "Dental Pain" },
            { id: "other", label: "Other Concern" },
          ].map((reason) => (
            <button
              key={reason.id}
              type="button"
              onClick={() => setPrimaryReason(reason.id)}
              className={`p-3 text-xs sm:text-sm font-semibold rounded-xl border text-center transition-all ${
                primaryReason === reason.id
                  ? "border-primary bg-primary/5 text-primary"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              {reason.label}
            </button>
          ))}
        </div>
      </div>

      {/* Pain Level Slider */}
      <div className="space-y-3 bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
        <div className="flex justify-between items-center">
          <label className="text-sm font-semibold text-gray-700">
            Current Pain Level
          </label>
          <span className={`text-sm ${getPainLevelColor(painLevel)}`}>
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
        <div className="flex justify-between text-[10px] text-gray-400 font-medium px-1">
          <span>None</span>
          <span>Mild</span>
          <span>Moderate</span>
          <span>Severe</span>
        </div>
      </div>

      {/* Checklist of symptoms */}
      <div className="space-y-3">
        <label className="text-sm font-semibold text-gray-700 block">
          Are you experiencing any of the following? (Select all that apply)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {symptomOptions.map((symptom) => {
            const isChecked = selectedSymptoms.includes(symptom.id);
            return (
              <button
                key={symptom.id}
                type="button"
                onClick={() => handleSymptomToggle(symptom.id)}
                className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all text-xs sm:text-sm font-medium ${
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
      <div className="space-y-2">
        <label className="text-sm font-semibold text-gray-700 block">
          Additional Notes or Specific Concerns (Optional)
        </label>
        <textarea
          rows={3}
          value={additionalNotes}
          onChange={(e) => setAdditionalNotes(e.target.value)}
          placeholder="Describe your concerns or symptoms in more detail..."
          className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all placeholder-gray-400"
        />
      </div>

      {/* Emergency Toggle */}
      <div className="flex items-center justify-between p-3 bg-danger/5 border border-danger/20 rounded-xl">
        <div className="space-y-0.5">
          <span className="text-xs sm:text-sm font-bold text-danger flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4" /> Is this a dental emergency?
          </span>
          <p className="text-[11px] text-gray-500">
            If selected, please approach the front desk immediately. Queue priority will be granted upon verification.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isEmergency}
            onChange={(e) => setIsEmergency(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-9 h-5 bg-gray-250 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:height-4 after:w-4 after:h-4 after:transition-all peer-checked:bg-danger"></div>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-4 pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-primary/5 border border-primary/20 text-primary text-sm font-semibold rounded-xl hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-colors cursor-pointer"
        >
          Continue
        </button>
      </div>
    </form>
  );
}
