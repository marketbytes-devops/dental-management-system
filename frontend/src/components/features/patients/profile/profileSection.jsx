"use client";

export default function ProfileSection({ title, items }) {
  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
      <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
        {items.map((item, idx) => (
          <div key={idx} className={item.fullWidth ? "sm:col-span-2" : ""}>
            <span className="block text-xs font-medium text-gray-400">{item.label}</span>
            <span className="font-semibold text-gray-800 mt-0.5 block">{item.value || "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
