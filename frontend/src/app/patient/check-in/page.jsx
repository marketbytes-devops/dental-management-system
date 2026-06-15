"use client";

import { useState } from "react";
import TodaysAppointmentBanner from "@/components/ui/patients/check-in/todaysAppointmentBanner";
import CheckInSymptomForm from "@/components/ui/patients/check-in/checkInSymptomForm";
import FrontDeskVerification from "@/components/ui/patients/check-in/frontDeskVerification";
import PatientOtpEntry from "@/components/ui/patients/check-in/patientOtpEntry";
import CheckInStepper from "@/components/ui/patients/check-in/checkInStepper";
import CheckInConfirmation from "@/components/ui/patients/check-in/checkInConfirmation";

// Mock Data
const TODAY_APPOINTMENTS = [
  {
    id: "APT-201",
    date: "2026-06-15",
    time: "10:30 AM",
    doctor: "Dr. Anoop Nair",
    treatment: "Root Canal",
    status: "Confirmed",
    notes: "",
  },
];

export default function CheckInPage() {
  const [step, setStep] = useState(1); // Steps: 1=Select, 2=Symptoms, 3=Wait for OTP, 4=Enter OTP, 5=Confirmation
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [symptomData, setSymptomData] = useState(null);

  const handleSelectAppointment = (appt) => {
    setSelectedAppt(appt);
    setStep(2);
  };

  const handleSymptomSubmit = (data) => {
    setSymptomData(data);
    setStep(3);
  };

  const handleOtpSent = () => {
    setStep(4);
  };

  const handleOtpVerify = () => {
    setStep(5);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select an Appointment</h3>
            </div>
            {TODAY_APPOINTMENTS.length > 0 ? (
              TODAY_APPOINTMENTS.map((appt) => (
                <TodaysAppointmentBanner
                  key={appt.id}
                  appointment={appt}
                  onSelect={handleSelectAppointment}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400">
                No eligible appointments today.
              </div>
            )}
          </div>
        );
      case 2:
        return (
          <CheckInSymptomForm
            onSubmit={handleSymptomSubmit}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <FrontDeskVerification
            isEmergency={symptomData?.isEmergency}
            onOtpSent={handleOtpSent}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <PatientOtpEntry
            onVerify={handleOtpVerify}
            onBack={handleBack}
          />
        );
      case 5:
        return <CheckInConfirmation appointment={selectedAppt} isEmergency={symptomData?.isEmergency} />;
      default:
        return null;
    }
  };

  const stepsMeta = [
    { number: 1, label: "Select" },
    { number: 2, label: "Symptoms" },
    { number: 3, label: "Wait" },
    { number: 4, label: "Verify OTP" },
    { number: 5, label: "Confirmed" },
  ];

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Clinic Self Check-In</h1>
        <p className="text-sm text-gray-500 mt-1">
          Check in on your phone when arriving at the clinic to notify staff.
        </p>
      </div>

      <CheckInStepper step={step} steps={stepsMeta} />

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        {renderStep()}
      </div>
    </div>
  );
}
