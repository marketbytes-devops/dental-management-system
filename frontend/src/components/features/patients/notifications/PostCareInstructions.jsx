import React from 'react';
import { ClipboardList } from 'lucide-react';

const getStepGuidelines = (step) => {
  const title = (step.title || "").toLowerCase();
  const details = step.details || "";
  const notes = step.notes || "";
  
  let guidelines = [];
  if (details) guidelines.push(details);
  if (notes) guidelines.push(notes);
  
  if (title.includes("root canal") || title.includes("rct") || title.includes("endodontic")) {
    guidelines.push(
      "Avoid chewing on the treated side until the permanent crown is placed.",
      "Mild soreness is expected for 2-3 days."
    );
  } else if (title.includes("extraction") || title.includes("surgical") || title.includes("wisdom") || title.includes("removal")) {
    guidelines.push(
      "Bite on the gauze pack for 45 minutes to control bleeding.",
      "Do not rinse, spit, or use a straw for 24 hours.",
      "Eat soft, cool foods."
    );
  } else if (title.includes("scaling") || title.includes("cleaning") || title.includes("polishing") || title.includes("hygiene")) {
    guidelines.push(
      "Avoid hot, cold, or highly acidic food if sensitive.",
      "Rinse with warm salt water if gums are tender."
    );
  } else if (title.includes("filling") || title.includes("composite") || title.includes("restoration") || title.includes("cavity")) {
    guidelines.push(
      "Avoid hot fluids until local anesthesia wears off.",
      "Expect mild sensitivity for a few days."
    );
  }
  return Array.from(new Set(guidelines));
};

export default function PostCareInstructions({ plans }) {
  if (!plans || plans.length === 0) {
     return <p className="text-xs text-gray-500 text-center py-6 font-semibold">No recent treatment plans found.</p>;
  }

  // Only take the last 2 plans
  const selectedPlans = plans.slice(0, 2);

  return (
    <div className="space-y-4">
      {selectedPlans.map((plan, planIdx) => {
        const stepsWithGuidelines = (plan.steps || []).filter(s => getStepGuidelines(s).length > 0);
        if (stepsWithGuidelines.length === 0) return null;

        return (
          <div key={plan.id || planIdx} className="bg-white rounded-xl border border-gray-100 shadow-2xs p-4 space-y-3">
            <div className="flex items-start justify-between pb-2.5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                  <ClipboardList className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-xs truncate max-w-[190px]">
                    {plan.diagnosis || "Active Treatment"}
                  </h3>
                  <p className="text-[9px] text-gray-400 font-semibold mt-0.5">
                    {plan.updated_at ? new Date(plan.updated_at).toLocaleDateString() : new Date(plan.created_at).toLocaleDateString()} • {plan.doctor_name}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              {stepsWithGuidelines.map((step, idx) => {
                const guidelines = getStepGuidelines(step);
                return (
                  <div key={step.id || idx} className="space-y-1 text-left">
                    <span className="text-[10px] font-bold text-gray-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {step.title} ({step.status})
                    </span>
                    <ul className="pl-4 space-y-1">
                      {guidelines.map((guide, gIdx) => (
                        <li key={gIdx} className="text-[11px] text-gray-600 list-disc font-medium leading-relaxed">{guide}</li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      
      {selectedPlans.every(plan => !(plan.steps || []).some(s => getStepGuidelines(s).length > 0)) && (
        <p className="text-xs text-gray-550 text-center py-6 font-semibold">No active precautions required for recent plans.</p>
      )}
    </div>
  );
}
