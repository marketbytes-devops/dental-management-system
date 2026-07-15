export default function HealthScoreCard({ score = 78, lastUpdated, onClick }) {
  // Determine color based on score
  const color =
    score >= 80 ? "text-success" : score >= 60 ? "text-warning" : "text-danger";
  const ringColor =
    score >= 80
      ? "stroke-success"
      : score >= 60
      ? "stroke-warning"
      : "stroke-danger";
  const bgColor =
    score >= 80 ? "bg-success/10" : score >= 60 ? "bg-warning/10" : "bg-danger/10";
  const label =
    score >= 80 ? "Excellent" : score >= 60 ? "Moderate" : "Needs Attention";

  // Format date if provided
  const displayDate = lastUpdated 
    ? new Date(lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "Recently Updated";

  // SVG ring math (shrunk to fit 72x72 container)
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 min-h-[110px]"
    >
      {/* Circular ring */}
      <div className="relative flex-shrink-0">
        <svg width="72" height="72" className="-rotate-90">
          {/* Background ring */}
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="6"
          />
          {/* Score ring */}
          <circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            strokeWidth="6"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${ringColor} transition-all duration-700`}
          />
        </svg>
        {/* Score number in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-base font-bold ${color}`}>{score}</span>
          <span className="text-[9px] text-gray-400 font-medium">/100</span>
        </div>
      </div>

      {/* Text info */}
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Oral Health Score
        </p>
        <p className={`text-base font-bold ${color} truncate`}>{label}</p>
        <span
          className={`inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded ${bgColor} ${color}`}
        >
          {displayDate}
        </span>
      </div>
    </div>
  );
}
