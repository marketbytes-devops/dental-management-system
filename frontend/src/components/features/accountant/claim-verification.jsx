"use client";

import { useState } from "react";

export default function AccountantClaimVerification() {
  const [patientId, setPatientId] = useState("");
  const [provider, setProvider] = useState("Star Health");
  const [policyNo, setPolicyNo] = useState("");
  const [eligibilityResult, setEligibilityResult] = useState(null);

  const handleVerify = (e) => {
    e.preventDefault();
    if (!patientId || !policyNo) {
      alert("Please fill in patient name/ID and insurance policy number.");
      return;
    }

    // Generate mock verification result
    setEligibilityResult({
      patient: patientId,
      policy: policyNo,
      provider: provider,
      status: "Eligible",
      coPayPercent: "20%",
      coverageMax: "₹50,000",
      deductibleMet: "Yes",
      preAuthRequired: "Yes for RCT / Surgery"
    });
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Insurance Eligibility Verification</h1>
        <p className="text-sm text-gray-500 mt-1">Pre-verify co-pay rates and policy coverage ceilings for patient accounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Verification Form */}
        <form onSubmit={handleVerify} className="lg:col-span-5 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Check Eligibility Status</h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Patient Name / ID</label>
            <input
              type="text"
              placeholder="e.g. Rahul Kumar"
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Provider</label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              >
                <option value="Star Health">Star Health</option>
                <option value="HDFC Ergo">HDFC Ergo</option>
                <option value="Niva Bupa">Niva Bupa</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Policy / Card No</label>
              <input
                type="text"
                placeholder="e.g. POL-998877"
                value={policyNo}
                onChange={(e) => setPolicyNo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
          >
            Check Eligibility
          </button>
        </form>

        {/* Verification Result Display */}
        {eligibilityResult && (
          <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="text-base font-extrabold text-gray-900">Verification Result Summary</h3>
              <span className="px-2.5 py-0.5 rounded text-xs font-black uppercase bg-success/15 text-success">
                {eligibilityResult.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase">Patient ID / Name</span>
                <p className="text-gray-800 font-semibold">{eligibilityResult.patient}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase">Insurance Provider</span>
                <p className="text-gray-800 font-semibold">{eligibilityResult.provider}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase">Patient Co-Pay %</span>
                <p className="text-primary font-bold">{eligibilityResult.coPayPercent}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase">Coverage Maximum</span>
                <p className="text-gray-800 font-semibold">{eligibilityResult.coverageMax}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase">Deductible Met</span>
                <p className="text-gray-800 font-semibold">{eligibilityResult.deductibleMet}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-bold uppercase">Pre-Auth Rules</span>
                <p className="text-warning font-semibold text-xs">{eligibilityResult.preAuthRequired}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
