import { Pill } from "lucide-react";

export default function PrescriptionCard({ rx }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-warning/20 transition-all relative overflow-hidden">
      {rx.active && (
        <div className="absolute top-0 right-0 bg-warning text-warning-950 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-bl-xl tracking-wider">
          Active
        </div>
      )}
      
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/5 flex items-center justify-center text-lg border border-warning/10">
            <Pill className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h4 className="text-base font-bold text-gray-900">{rx.drug}</h4>
            <p className="text-xs text-gray-400 font-medium">Prescribed on {rx.date}</p>
          </div>
        </div>

        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1">
          <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider block">Dosage & Instructions</span>
          <p className="text-sm font-semibold text-gray-800">{rx.dosage}</p>
        </div>
      </div>

      <div className="border-t border-gray-100 mt-4 pt-3 text-xs text-gray-500 text-left">
        <span>By {rx.doctor}</span>
      </div>
    </div>
  );
}
