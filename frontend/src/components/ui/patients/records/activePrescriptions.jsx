import PrescriptionCard from "./prescriptionCard";

export default function ActivePrescriptions({ prescriptions = [] }) {
  const activeList = prescriptions.filter((rx) => rx.active);

  if (activeList.length === 0) {
    return (
      <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-6 text-center text-gray-400 text-sm">
        No active medications at this time.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-900">Current active medications</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeList.map((rx) => (
          <PrescriptionCard key={rx.id} rx={rx} />
        ))}
      </div>
    </div>
  );
}
