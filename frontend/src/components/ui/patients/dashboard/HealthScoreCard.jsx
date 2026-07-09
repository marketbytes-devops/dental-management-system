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

  // SVG ring math
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 xl:p-6 flex flex-col sm:flex-row xl:flex-col 2xl:flex-row items-center sm:items-center xl:items-center 2xl:items-center gap-4 xl:gap-6 cursor-pointer hover:shadow-md hover:border-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-center sm:text-left xl:text-center 2xl:text-left"
    >
      {/* Circular ring */}
      <div className="relative flex-shrink-0">
        <svg width="96" height="96" className="-rotate-90">
          {/* Background ring */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Score ring */}
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={`${ringColor} transition-all duration-700`}
          />
        </svg>
        {/* Score number in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-xl font-bold ${color}`}>{score}</span>
          <span className="text-[10px] text-gray-400 font-medium">/100</span>
        </div>
      </div>

      {/* Text info */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
          Oral Health Score
        </p>
        <p className={`text-lg font-bold ${color}`}>{label}</p>
        <span
          className={`inline-block mt-2 text-xs font-semibold px-2.5 py-1 rounded-md ${bgColor} ${color}`}
        >
          Last updated: {displayDate}
        </span>
        <p className="text-xs text-gray-400 mt-2">
          Based on your last dental examination
        </p>
      </div>
    </div>
  );
}
