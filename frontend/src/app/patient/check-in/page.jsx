"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import TodaysAppointmentBanner from "@/components/ui/patients/check-in/todaysAppointmentBanner";
import CheckInSymptomForm from "@/components/ui/patients/check-in/checkInSymptomForm";
import FrontDeskVerification from "@/components/ui/patients/check-in/frontDeskVerification";
import PatientOtpEntry from "@/components/ui/patients/check-in/patientOtpEntry";
import CheckInStepper from "@/components/ui/patients/check-in/checkInStepper";
import CheckInConfirmation from "@/components/ui/patients/check-in/checkInConfirmation";

export default function CheckInPage() {
  const [step, setStep] = useState(1); // Steps: 1=Select, 2=Symptoms, 3=Wait for OTP, 4=Enter OTP, 5=Confirmation
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [symptomData, setSymptomData] = useState(null);
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
        const profileRes = await fetch("http://localhost:8000/patient/profile", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (!profileRes.ok) {
          throw new Error("Failed to load patient profile.");
        }
        const profileData = await profileRes.json();
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

  // Poll for status updates when in Step 3 (Waiting for OTP send or bypass)
  useEffect(() => {
    let intervalId;
    if (step === 3 && selectedAppt && patientId) {
      const pollStatus = async () => {
        try {
          const appts = await fetchAppointments(patientId);
          const updated = appts.find(a => a.id === selectedAppt.id);
          if (updated) {
            setSelectedAppt(updated);
            if (updated.status === "Waiting") {
              // Receptionist bypassed OTP check, go straight to confirmation
              await fetchQueueDetails(updated.id);
              setStep(5);
            } else if (updated.otp_status === "Sent") {
              // Receptionist sent OTP code, advance to entering screen
              setStep(4);
            }
          }
        } catch (err) {
          console.error("Polling status error:", err);
        }
      };
      
      // Poll every 3 seconds
      intervalId = setInterval(pollStatus, 3000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [step, selectedAppt?.id, patientId]);

  const fetchAppointments = async (pId) => {
    try {
      const response = await fetch(`http://localhost:8000/frontdesk/appointments/patient/${pId}`);
      if (response.ok) {
        const data = await response.json();
        
        // Filter for today's appointments in valid states
        const todayStr = new Date().toISOString().split("T")[0];
        
        const formatted = data
          .filter(appt => appt.appointment_date === todayStr)
          .map(appt => ({
            id: appt.id,
            date: appt.appointment_date,
            time: appt.appointment_time,
            doctor: appt.doctor_name,
            treatment: appt.treatment_type,
            status: appt.status,
            otp_status: appt.otp_status,
            otp: appt.otp,
            wait_time_estimate: appt.wait_time_estimate,
            symptoms: appt.symptoms,
            priority: appt.priority
          }));

        setAppointments(formatted);

        // Check if there is an active check-in flow already in progress
        const activeAppt = formatted.find(appt => ["Pending OTP", "Waiting"].includes(appt.status));
        if (activeAppt && !selectedAppt) {
          setSelectedAppt(activeAppt);
          setSymptomData({ isEmergency: activeAppt.priority === "Emergency" });
          
          if (activeAppt.status === "Pending OTP") {
            if (activeAppt.otp_status === "Sent") {
              setStep(4);
            } else {
              setStep(3);
            }
          } else if (activeAppt.status === "Waiting") {
            await fetchQueueDetails(activeAppt.id);
            setStep(5);
          }
        }
        return formatted;
      }
    } catch (err) {
      console.error("Error fetching patient appointments:", err);
    }
    return [];
  };

  const fetchQueueDetails = async (apptId) => {
    try {
      const queueRes = await fetch("http://localhost:8000/frontdesk/queue");
      if (queueRes.ok) {
        const queueData = await queueRes.json();
        const index = queueData.findIndex(q => q.id === apptId);
        if (index !== -1) {
          setQueueNo(index + 1);
          setWaitTime(queueData[index].wait_time_estimate);
        } else {
          setQueueNo(null);
          setWaitTime(null);
        }
      }
    } catch (err) {
      console.error("Error fetching queue details:", err);
    }
  };

  const handleSelectAppointment = (appt) => {
    setSelectedAppt(appt);
    setStep(2);
  };

  const handleSymptomSubmit = async (data) => {
    setSymptomData(data);
    
    // Package symptom details for the backend
    const symptomString = [
      `Reason: ${data.primaryReason}`,
      `Pain: ${data.painLevel}/10`,
      data.symptoms.length > 0 ? `Symptoms: ${data.symptoms.join(", ")}` : "",
      data.additionalNotes ? `Notes: ${data.additionalNotes}` : ""
    ].filter(Boolean).join(" | ");

    try {
      const res = await fetch(`http://localhost:8000/frontdesk/appointments/${selectedAppt.id}/checkin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          symptoms: symptomString,
          is_emergency: data.isEmergency
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to initiate self check-in.");
      }
      
      const updatedAppt = await res.json();
      setSelectedAppt({
        id: updatedAppt.id,
        date: updatedAppt.appointment_date,
        time: updatedAppt.appointment_time,
        doctor: updatedAppt.doctor_name,
        treatment: updatedAppt.treatment_type,
        status: updatedAppt.status,
        otp_status: updatedAppt.otp_status,
        otp: updatedAppt.otp,
        wait_time_estimate: updatedAppt.wait_time_estimate,
        symptoms: updatedAppt.symptoms,
        priority: updatedAppt.priority
      });
      
      setStep(3);
    } catch (err) {
      alert(err.message || "Failed to submit check-in request. Please try again.");
    }
  };

  const handleOtpSentSimulated = async () => {
    try {
      // Simulate receptionist clicking 'Send OTP' from patient's side
      const res = await fetch(`http://localhost:8000/frontdesk/appointments/${selectedAppt.id}/send-otp`, {
        method: "POST"
      });
      if (res.ok) {
        const updatedAppt = await res.json();
        setSelectedAppt({
          id: updatedAppt.id,
          date: updatedAppt.appointment_date,
          time: updatedAppt.appointment_time,
          doctor: updatedAppt.doctor_name,
          treatment: updatedAppt.treatment_type,
          status: updatedAppt.status,
          otp_status: updatedAppt.otp_status,
          otp: updatedAppt.otp,
          wait_time_estimate: updatedAppt.wait_time_estimate,
          symptoms: updatedAppt.symptoms,
          priority: updatedAppt.priority
        });
        setStep(4);
      }
    } catch (err) {
      console.error("Failed to simulate OTP send:", err);
      setStep(4);
    }
  };

  const handleOtpVerify = async (enteredOtp) => {
    try {
      const res = await fetch(`http://localhost:8000/frontdesk/appointments/${selectedAppt.id}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          otp: enteredOtp
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Invalid verification code.");
      }
      
      const updatedAppt = await res.json();
      setSelectedAppt({
        id: updatedAppt.id,
        date: updatedAppt.appointment_date,
        time: updatedAppt.appointment_time,
        doctor: updatedAppt.doctor_name,
        treatment: updatedAppt.treatment_type,
        status: updatedAppt.status,
        otp_status: updatedAppt.otp_status,
        otp: updatedAppt.otp,
        wait_time_estimate: updatedAppt.wait_time_estimate,
        symptoms: updatedAppt.symptoms,
        priority: updatedAppt.priority
      });
      
      await fetchQueueDetails(updatedAppt.id);
      setStep(5);
    } catch (err) {
      throw new Error(err.message || "Failed to verify OTP.");
    }
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
            {appointments.length > 0 ? (
              appointments.map((appt) => (
                <TodaysAppointmentBanner
                  key={appt.id}
                  appointment={appt}
                  onSelect={handleSelectAppointment}
                />
              ))
            ) : (
              <div className="text-center py-8 text-gray-400 font-bold">
                No eligible appointments scheduled for today.
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
            onOtpSent={handleOtpSentSimulated}
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
        return (
          <CheckInConfirmation 
            appointment={selectedAppt} 
            isEmergency={symptomData?.isEmergency} 
            queueNo={queueNo}
            waitTime={waitTime}
          />
        );
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
