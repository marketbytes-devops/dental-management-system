"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TodaysAppointmentBanner from "@/components/features/patients/check-in/todaysAppointmentBanner";
import CheckInSymptomForm from "@/components/features/patients/check-in/checkInSymptomForm";
import ConsultationPaymentStep from "@/components/features/patients/check-in/consultationPaymentStep";
import PrintableTokenSheet from "@/components/features/patients/check-in/printableTokenSheet";
import CheckInStepper from "@/components/features/patients/check-in/checkInStepper";
import client from "@/services/api";

export default function CheckInPage() {
  const [step, setStep] = useState(1); // 1=Select, 2=Screening Questionnaire, 3=Consultation Payment, 4=Printable Medical Pass
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [symptomData, setSymptomData] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [patientProfile, setPatientProfile] = useState(null);
  const [patientId, setPatientId] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [queueNo, setQueueNo] = useState(null);
  const [waitTime, setWaitTime] = useState(null);

  // Fetch patient profile and appointments on mount
  useEffect(() => {
    async function initCheckIn() {
      const token = localStorage.getItem("patient_jwt_token");
      if (!token) {
        setError("You are not authenticated as a patient. Please log in first.");
        setLoading(false);
        return;
      }
      
      try {
        const profileRes = await client.get("/patient/profile");
        const profileData = profileRes.data;
        setPatientProfile(profileData);
        const pId = profileData.id;
        setPatientId(pId);
        
        await fetchAppointments(pId);
      } catch (err) {
        console.error("Error initializing check-in:", err);
        setError(err.message || "Failed to load patient details.");
      } finally {
        setLoading(false);
      }
    }
    initCheckIn();
  }, []);

  const fetchAppointments = async (pId) => {
    try {
      const response = await client.get(`/frontdesk/appointments/patient/${pId}`);
      const data = response.data;
      
      // Filter for today's appointments in valid states
      const todayStr = new Date().toISOString().split("T")[0];
      
      const formatted = data
        .filter(appt => appt.appointment_date === todayStr && !["Completed", "Checked Out", "Cancelled"].includes(appt.status))
        .map(appt => ({
          id: appt.id,
          date: appt.appointment_date,
          time: appt.appointment_time,
          doctor: appt.doctor_name,
          treatment: appt.treatment_type,
          status: appt.status,
          payment_status: appt.payment_status,
          otp_status: appt.otp_status,
          wait_time_estimate: appt.wait_time_estimate,
          symptoms: appt.symptoms,
          priority: appt.priority
        }));

      setAppointments(formatted);

      // Check if there is an active check-in flow already in progress
      const activeAppt = formatted.find(appt => ["Waiting"].includes(appt.status));
      if (activeAppt && !selectedAppt) {
        setSelectedAppt(activeAppt);
        setSymptomData({ isEmergency: activeAppt.priority === "Emergency" });
        await fetchQueueDetails(activeAppt.id);
        setStep(4);
      }
      return formatted;
    } catch (err) {
      console.error("Error fetching patient appointments:", err);
    }
    return [];
  };

  const fetchQueueDetails = async (apptId) => {
    try {
      const queueRes = await client.get("/frontdesk/queue");
      const queueData = queueRes.data;
      
      const currentAppt = queueData.find(q => q.id === apptId);
      if (currentAppt) {
        const doctorQueue = queueData.filter(q => q.doctor_name === currentAppt.doctor_name);
        const index = doctorQueue.findIndex(q => q.id === apptId);
        
        setQueueNo(index >= 0 ? index + 1 : 1);
        setWaitTime(currentAppt.wait_time_estimate);
      } else {
        setQueueNo(1);
        setWaitTime(0);
      }
    } catch (err) {
      console.error("Error fetching queue details:", err);
      setQueueNo(1);
      setWaitTime(0);
    }
  };

  const handleSelectAppointment = (appt) => {
    setSelectedAppt(appt);
    setStep(2);
  };

  const handleSymptomSubmit = (data) => {
    setSymptomData(data);
    setStep(3);
  };

  const handlePaymentSuccess = async ({ appointment: updatedAppt, paymentDetails: payData }) => {
    setSelectedAppt(updatedAppt);
    setPaymentDetails(payData);
    await fetchQueueDetails(updatedAppt.id);
    setStep(4);
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
              <h3 className="text-lg font-bold text-gray-900 mb-1">Select Today's Appointment</h3>
              <p className="text-xs text-gray-500">Choose your scheduled visit to begin online screening and check-in.</p>
            </div>
            {appointments.length > 0 ? (
              appointments.map((appt) => (
                <TodaysAppointmentBanner
                  key={appt.id}
                  appointment={appt}
                  onSelect={handleSelectAppointment}
                />
              ))
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-2xl border border-gray-150">
                <p className="text-sm font-bold text-gray-700">No eligible appointments scheduled for today.</p>
                <Link href="/patient/appointments" className="mt-2 inline-block text-xs font-bold text-primary hover:underline">
                  Book an appointment now →
                </Link>
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
          <ConsultationPaymentStep
            appointment={selectedAppt}
            symptomData={symptomData}
            onPaymentSuccess={handlePaymentSuccess}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <PrintableTokenSheet
            appointment={selectedAppt}
            paymentDetails={paymentDetails}
            queueNo={queueNo}
            waitTime={waitTime}
            isEmergency={symptomData?.isEmergency}
            patientProfile={patientProfile}
          />
        );
      default:
        return null;
    }
  };

  const stepsMeta = [
    { number: 1, label: "Select Appt" },
    { number: 2, label: "Screening" },
    { number: 3, label: "Consultation Payment" },
    { number: 4, label: "Medical Pass" },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 mt-4">Loading check-in workspace...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-10 bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
        <p className="text-sm text-gray-700 font-semibold">{error}</p>
        <Link
          href="/login"
          className="inline-block px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-sm"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-10">
      <div className="no-print">
        <h1 className="text-2xl font-bold text-gray-900">Clinic Self Check-In & Triage Pass</h1>
        <p className="text-xs text-gray-500 mt-1">
          Complete your dental screening questionnaire and consultation charge payment to receive your live doctor queue token pass.
        </p>
      </div>

      <div className="no-print">
        <CheckInStepper step={step} steps={stepsMeta} />
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm">
        {renderStep()}
      </div>
    </div>
  );
}

