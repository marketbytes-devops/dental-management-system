import Link from "next/link";

const actions = [
  {
    label: "Book Appointment",
    icon: "📅",
    href: "/patient/appointments",
    color: "bg-primary/10 text-primary hover:bg-primary/20",
    description: "Schedule a new visit",
  },
  {
    label: "Pay Outstanding Bill",
    icon: "💳",
    href: "/patient/billing",
    color: "bg-danger/10 text-danger hover:bg-danger/20",
    description: "₹2,400 due",
  },
  {
    label: "Self Check-In",
    icon: "✅",
    href: "/patient/check-in",
    color: "bg-success/10 text-success hover:bg-success/20",
    description: "For today's appointment",
  },
];

export default function QuickActionsBar() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {actions.map((action) => (
        <Link
          key={action.label}
          href={action.href}
          className={`flex items-center gap-4 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 group`}
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-colors ${action.color}`}
          >
            {action.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 group-hover:text-primary transition-colors">
              {action.label}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{action.description}</p>
          </div>
          <span className="ml-auto text-gray-300 group-hover:text-primary transition-colors text-lg">
            →
          </span>
        </Link>
      ))}
    </div>
  );
}
