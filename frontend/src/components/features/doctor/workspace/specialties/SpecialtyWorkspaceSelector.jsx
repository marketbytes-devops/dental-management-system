"use client";

import { SPECIALTY_REGISTRY } from "./specialtyRegistry";

export default function SpecialtyWorkspaceSelector({ selectedSpecialty, onSelectSpecialty }) {
  const specialties = Object.values(SPECIALTY_REGISTRY);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          Procedure Specialties Workspace
        </h4>
        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">
          Active: {SPECIALTY_REGISTRY[selectedSpecialty]?.label}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {specialties.map((spec) => {
          const Icon = spec.icon;
          const isActive = selectedSpecialty === spec.id;

          return (
            <button
              key={spec.id}
              type="button"
              onClick={() => onSelectSpecialty(spec.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer outline-none ${
                isActive
                  ? "bg-primary/10 text-primary border-primary/20 font-bold"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {spec.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
