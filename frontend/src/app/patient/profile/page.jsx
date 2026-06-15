"use client";

import { useState } from "react";
import ProfileHeader from "@/components/ui/patients/profile/profileHeader";
import ProfileSection from "@/components/ui/patients/profile/profileSection";
import InsuranceCard from "@/components/ui/patients/profile/insuranceCard";
import EditProfileModal from "@/components/ui/patients/profile/editProfileModal";
import { Pencil } from "lucide-react";

// Mock Data
const INITIAL_PATIENT = {
  id: "PT-10042",
  name: "Rahul Kumar",
  avatar: "R",
  dob: "1990-04-15",
  phone: "+91 98765 43210",
  email: "rahul@example.com",
  memberSince: "2022-08-10",
  registeredVia: "Walk-in",
  address: "Flat 402, Signature Residency, Sector 56, Gurgaon, HR - 122011",
  insurance: { provider: "Star Health & Allied Insurance", policyId: "SH-2024-991", coverage: 70 },
  emergencyContact: { name: "Priya Kumar", relation: "Spouse", phone: "+91 91234 56789" },
};

export default function ProfilePage() {
  const [patient, setPatient] = useState(INITIAL_PATIENT);
  const [isEditing, setIsEditing] = useState(false);

  const handleSave = (updatedData) => {
    setPatient(updatedData);
    setIsEditing(false);
  };

  const personalItems = [
    { label: "Date of Birth", value: patient.dob },
    { label: "Phone Number", value: patient.phone },
    { label: "Email Address", value: patient.email },
    { label: "Residential Address", value: patient.address, fullWidth: true },
  ];

  const emergencyItems = [
    { label: "Contact Name", value: patient.emergencyContact.name },
    { label: "Relationship", value: patient.emergencyContact.relation },
    { label: "Phone Number", value: patient.emergencyContact.phone },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/5 border border-primary/20 text-primary text-sm font-semibold rounded-xl hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-colors cursor-pointer"
        >
          <Pencil className="w-4 h-4" /> Edit Profile
        </button>
      </div>

      <ProfileHeader patient={patient} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ProfileSection title="Personal Information" items={personalItems} />
          <ProfileSection title="Emergency Contact Details" items={emergencyItems} />
        </div>
        <div className="lg:col-span-1">
          <InsuranceCard insurance={patient.insurance} />
        </div>
      </div>

      {isEditing && (
        <EditProfileModal
          patient={patient}
          onClose={() => setIsEditing(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
