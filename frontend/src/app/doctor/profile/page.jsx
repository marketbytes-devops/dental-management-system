"use client";

import { useState, useEffect } from "react";
import { Pencil } from "lucide-react";
import DoctorProfileHeader from "@/components/ui/doctor/profile/DoctorProfileHeader";
import DoctorProfileSection from "@/components/ui/doctor/profile/DoctorProfileSection";
import DoctorCredentialsCard from "@/components/ui/doctor/profile/DoctorCredentialsCard";
import SecuritySettingsCard from "@/components/ui/doctor/profile/SecuritySettingsCard";
import EditDoctorProfileModal from "@/components/ui/doctor/profile/EditDoctorProfileModal";

// Initial Mock Data
const INITIAL_DOCTOR = {
  id: "DR-20015",
  name: "Dr. Anoop Nair",
  dob: "1984-07-22",
  phone: "+91 98765 12345",
  email: "dr.anoop@smilecare.com",
  memberSince: "2023-04-12",
  registrationMode: "Staff Boarding",
  address: "Apt 501, Oakwood Apartments, DLF Phase 3, Gurgaon, HR - 122002",
  credentials: {
    specialty: "MDS - Endodontist",
    department: "Conservative Dentistry & Endodontics",
    licenceId: "DENT-88492",
    chairSetup: "Chair 3 (Clinical Room A)",
    board: "Dental Council of India"
  }
};

export default function DoctorProfilePage() {
  const [doctor, setDoctor] = useState(INITIAL_DOCTOR);
  const [isEditing, setIsEditing] = useState(false);

  // Sync state with localStorage on mount
  useEffect(() => {
    const savedProfile = localStorage.getItem("smilecare_doctor_profile");
    if (savedProfile) {
      try {
        setDoctor(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Failed to parse saved profile:", e);
      }
    }
  }, []);

  const handleSave = (updatedData) => {
    // Update doctor data
    const updated = {
      ...updatedData,
      credentials: {
        ...doctor.credentials,
        specialty: updatedData.credentials?.specialty || doctor.credentials.specialty,
      }
    };
    setDoctor(updated);
    localStorage.setItem("smilecare_doctor_profile", JSON.stringify(updated));
    setIsEditing(false);
  };

  const personalItems = [
    { label: "Date of Birth", value: doctor.dob },
    { label: "Phone Number", value: doctor.phone },
    { label: "Email Address", value: doctor.email },
    { label: "Residential Address", value: doctor.address, fullWidth: true },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal profile details, clinical credentials, and security credentials.
          </p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/5 border border-primary/20 text-primary text-sm font-semibold rounded-xl hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-colors cursor-pointer outline-none shrink-0"
        >
          <Pencil className="w-4 h-4" /> Edit Profile
        </button>
      </div>

      <DoctorProfileHeader doctor={doctor} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DoctorProfileSection title="Personal Information" items={personalItems} />
          <SecuritySettingsCard />
        </div>
        <div className="lg:col-span-1">
          <DoctorCredentialsCard credentials={doctor.credentials} />
        </div>
      </div>

      {isEditing && (
        <EditDoctorProfileModal
          doctor={doctor}
          onClose={() => setIsEditing(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
