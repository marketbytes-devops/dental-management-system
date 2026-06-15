"use client";

import { useState } from "react";
import TreatmentTimeline from "@/components/ui/patients/records/treatmentTimeline";
import PrescriptionCard from "@/components/ui/patients/records/prescriptionCard";
import ActivePrescriptions from "@/components/ui/patients/records/activePrescriptions";
import ReferralCard from "@/components/ui/patients/records/referralCard";
import { myAppointments, myPrescriptions } from "@/components/ui/patients/mockData";

export default function PatientRecordsPage() {
  const [activeTab, setActiveTab] = useState("treatment"); // treatment | active-rx | all-rx | referrals

  const mockReferral = {
    id: "REF-091",
    date: "2026-05-15",
    specialistName: "Dr. Sandeep Goel",
    specialty: "Maxillofacial Surgeon",
    clinicName: "Goel Craniofacial & Dental Implant Center",
    reason: "Evaluation for surgical extraction of impacted mandibular third molar (tooth #38) due to recurrent pericoronitis.",
    referredBy: "Dr. Anoop Nair",
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "treatment":
        return (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Treatment Timeline</h3>
            <TreatmentTimeline appointments={myAppointments} />
          </div>
        );
      case "active-rx":
        return <ActivePrescriptions prescriptions={myPrescriptions} />;
      case "all-rx":
        return (
          <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-6">Prescription History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {myPrescriptions.map((rx) => (
                <PrescriptionCard key={rx.id} rx={rx} />
              ))}
            </div>
          </div>
        );
      case "referrals":
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900">Referral Letters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ReferralCard referral={mockReferral} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Medical Records</h1>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 overflow-x-auto no-scrollbar gap-6">
        {[
          { id: "treatment", label: "Treatment Timeline" },
          { id: "active-rx", label: "Active Prescriptions" },
          { id: "all-rx", label: "Prescription History" },
          { id: "referrals", label: "Referral Letters" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6">{renderTabContent()}</div>
    </div>
  );
}
