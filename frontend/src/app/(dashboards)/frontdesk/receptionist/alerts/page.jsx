"use client";

import { useState, useEffect } from "react";
import AlertsTracker from "@/components/features/doctor/alerts/AlertsTracker";
import { getQueue } from "@/services/api";

export default function ReceptionistAlertsPage() {
  const [patients, setPatients] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchActivePatients = async () => {
    try {
      setIsLoading(true);
      const queueData = await getQueue();
      const patientDict = {};
      const emergencyQueue = queueData.filter(q => q.priority === "Emergency" || (q.chief_complaint && q.chief_complaint.includes("[UNVERIFIED EMERGENCY]")));
      
      emergencyQueue.forEach(q => {
        patientDict[q.token] = {
          token: q.token,
          name: q.patient_name,
          age: q.age,
          gender: q.gender,
          phone: q.patient_phone,
          procedure: q.procedure || "Consultation",
          medicalAlerts: q.medical_alerts || [],
        };
      });
      setPatients(patientDict);
    } catch (err) {
      console.error("Error fetching active patients for alerts:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivePatients();
    const interval = setInterval(fetchActivePatients, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading && Object.keys(patients).length === 0) {
    return <div className="p-10 text-center text-gray-500">Loading alerts...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Medical Alerts Monitor</h1>
        <p className="text-sm text-gray-500 mt-1">Monitor high-risk patient conditions, allergies, and emergency check-ins.</p>
      </div>

      <AlertsTracker
        patients={patients}
        activePatient={null}
        activePatientToken={null}
        onAddAlert={() => alert("Please ask the doctor to add or modify medical alerts.")}
      />
    </div>
  );
}
