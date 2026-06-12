export default function ReferralCard({ referral }) {
  // If no referrals, return placeholder
  if (!referral) {
    return (
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm text-center py-8 text-gray-400 text-sm">
        No active medical referral letters issued.
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between hover:border-primary/20 transition-all">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Referral Letter · {referral.date}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-primary/5 text-primary">
            Active
          </span>
        </div>

        <div>
          <h4 className="text-base font-extrabold text-gray-900">{referral.specialistName}</h4>
          <p className="text-xs text-gray-500 mt-0.5">{referral.specialty} · {referral.clinicName}</p>
        </div>

        <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 space-y-1 text-xs text-gray-600">
          <span className="font-bold text-gray-700 block">Reason for Referral:</span>
          <p className="italic leading-normal">"{referral.reason}"</p>
        </div>
      </div>

      <div className="border-t border-gray-100 mt-4 pt-3 flex items-center justify-between text-xs">
        <span className="text-gray-400 font-medium">Referred by {referral.referredBy}</span>
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
