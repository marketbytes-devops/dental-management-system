"use client";

export default function CheckInStepper({ step, steps }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-gray-150 -translate-y-1/2 z-0" />
        <div
          className="absolute left-0 top-1/2 h-0.5 bg-primary -translate-y-1/2 z-0 transition-all duration-300"
          style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((s) => {
          const isCompleted = step > s.number;
          const isActive = step === s.number;

          return (
            <div key={s.number} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm transition-all border ${
                  isCompleted
                    ? "bg-primary border-primary text-white"
                    : isActive
                    ? "bg-white border-primary text-primary shadow-sm shadow-primary/20 ring-4 ring-primary/10"
                    : "bg-white border-gray-250 text-gray-400"
                }`}
              >
                {isCompleted ? "✓" : s.number}
              </div>
              <span
                className={`text-xs font-semibold mt-2 ${
                  isActive ? "text-primary font-bold" : isCompleted ? "text-gray-900" : "text-gray-400"
                }`}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
