const activities = [
  {
    icon: "🦷",
    iconBg: "bg-primary/10",
    title: "Scaling & Polishing completed",
    subtitle: "by Dr. Anoop Nair",
    time: "May 12, 2026",
    tag: "Last Visit",
    tagColor: "bg-primary/10 text-primary",
  },
  {
    icon: "💊",
    iconBg: "bg-warning/10",
    title: "Amoxicillin 500mg prescribed",
    subtitle: "1 cap × 3 times/day for 5 days",
    time: "May 12, 2026",
    tag: "Prescription",
    tagColor: "bg-warning/10 text-warning",
  },
  {
    icon: "💳",
    iconBg: "bg-success/10",
    title: "Invoice #INV-089 paid",
    subtitle: "₹450 — Scaling & Polishing",
    time: "May 12, 2026",
    tag: "Payment",
    tagColor: "bg-success/10 text-success",
  },
  {
    icon: "📄",
    iconBg: "bg-secondary/10",
    title: "Consent form signed",
    subtitle: "For upcoming Root Canal procedure",
    time: "Jun 10, 2026",
    tag: "Document",
    tagColor: "bg-secondary/10 text-secondary",
  },
];

export default function RecentActivityFeed() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-gray-900">Recent Activity</h3>
        <span className="text-xs text-gray-400">Your latest updates</span>
      </div>

      <ul className="space-y-4">
        {activities.map((item, idx) => (
          <li
            key={idx}
            className="flex items-start gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors"
          >
            {/* Icon */}
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg ${item.iconBg}`}
            >
              {item.icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">{item.title}</p>
              <p className="text-xs text-gray-500 mt-0.5">{item.subtitle}</p>
            </div>

            {/* Right side: tag + time */}
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${item.tagColor}`}
              >
                {item.tag}
              </span>
              <span className="text-xs text-gray-400">{item.time}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
