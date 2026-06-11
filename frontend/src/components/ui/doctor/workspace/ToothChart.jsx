"use client";

export default function ToothChart({ teethChart = {}, onToggleToothState }) {
  const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  const getToothStyles = (tooth) => {
    const state = teethChart[tooth];
    if (state === "active-treatment") {
      return "bg-red-50 border-danger text-danger font-extrabold shadow-sm";
    } else if (state === "restored") {
      return "bg-success/10 border-success text-success";
    } else if (state === "lab-ordered") {
      return "bg-warning/10 border-warning text-warning";
    } else {
      return "bg-white border-gray-200 text-gray-500 hover:border-primary/50 hover:text-primary";
    }
  };

  const getToothEmoji = (tooth) => {
    const state = teethChart[tooth];
    if (state === "active-treatment") return "🚨";
    if (state === "restored") return "👑";
    if (state === "lab-ordered") return "🔬";
    return "🦷";
  };

  return (
    <div className="border border-gray-100 rounded-xl p-5 bg-gray-50/20">
      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
        <span>🦷</span> Tooth Chart Mapping
      </h4>
      <div className="flex flex-col items-center gap-4 bg-white p-6 border border-gray-100 rounded-xl">
        {/* Upper row */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          {upperTeeth.map(tooth => (
            <button
              key={tooth}
              onClick={() => onToggleToothState(tooth)}
              className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold border transition-all cursor-pointer ${getToothStyles(tooth)}`}
            >
              {tooth}
              <span className="text-[7px]">{getToothEmoji(tooth)}</span>
            </button>
          ))}
        </div>
        {/* Lower row */}
        <div className="flex gap-1.5 flex-wrap justify-center">
          {lowerTeeth.map(tooth => (
            <button
              key={tooth}
              onClick={() => onToggleToothState(tooth)}
              className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center text-[10px] font-bold border transition-all cursor-pointer ${getToothStyles(tooth)}`}
            >
              {tooth}
              <span className="text-[7px]">{getToothEmoji(tooth)}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-4 mt-4 text-[9px] text-gray-505 font-semibold">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-100 border border-danger"></span> Active Treatment
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-success/10 border border-success"></span> Restored / Crown
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-warning/10 border border-warning"></span> Lab Order Placed
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded bg-white border border-gray-200"></span> Healthy Tooth
        </span>
      </div>
    </div>
  );
}
