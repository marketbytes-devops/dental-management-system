export default function ReferralCard({ referral }) {
  // If no referrals, return placeholder
  if (!referral) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center py-8 text-gray-400 text-sm">
        No active medical referral letters issued.
      </div>
    );
  }

  const isCompleted = referral.status === "Completed";

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-primary/20 hover:shadow-md transition-all duration-300">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Referral Letter · {referral.date}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
            isCompleted 
              ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
              : "bg-amber-50 text-amber-700 border-amber-100"
          }`}>
            {referral.status || "Pending"}
          </span>
        </div>

        <div>
          <h4 className="text-base font-extrabold text-gray-900">{referral.specialistName}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{referral.specialty} · {referral.clinicName}</p>
        </div>

        {/* Reason for Referral */}
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-1 text-xs text-gray-650">
          <span className="font-bold text-gray-700 block">Reason for Referral:</span>
          <p className="italic leading-normal">"{referral.reason}"</p>
        </div>

        {/* Consultation Findings (Remarks) */}
        {isCompleted && (
          <div className="space-y-3 pt-2">
            <div className="bg-emerald-50/20 p-4 rounded-xl border border-emerald-100 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="font-extrabold text-emerald-800 uppercase tracking-wider block text-[10px]">
                  Specialist Consultation Remarks:
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded">
                  ✓ Consulted by {referral.specialistName}
                </span>
              </div>
              <p className="font-semibold text-gray-800 leading-normal">
                {referral.consultationNotes || "No notes recorded."}
              </p>
            </div>

            {referral.medications && referral.medications.length > 0 && (
              <div className="space-y-1.5">
                <span className="font-extrabold text-gray-400 uppercase tracking-wider block text-[10px]">
                  Prescribed Medications:
                </span>
                <div className="bg-slate-50 border border-gray-150 rounded-xl p-3 space-y-1 text-xs">
                  {referral.medications.map((m, idx) => (
                    <div key={idx} className="font-semibold text-gray-700">
                      💊 {m.medicine} — {m.schedule} ({m.timing || "As Directed"}) for {m.duration}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-gray-150 mt-5 pt-4 flex items-center justify-between text-xs">
        <span className="text-gray-450 font-medium">Referred by {referral.referredBy}</span>
        <button
          onClick={() => alert("Printing referral letter is not supported in the mock version.")}
          className="text-primary font-bold hover:underline"
        >
          📄 Print Letter
        </button>
      </div>
    </div>
  );
}
