"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProfileHeader from "@/components/ui/patients/profile/profileHeader";
import ProfileSection from "@/components/ui/patients/profile/profileSection";
import InsuranceCard from "@/components/ui/patients/profile/insuranceCard";
import EditProfileModal from "@/components/ui/patients/profile/editProfileModal";
import PatientSecurityCard from "@/components/ui/patients/profile/patientSecurityCard";
import { Pencil } from "lucide-react";

export default function ProfilePage() {
  const [patient, setPatient] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      const token = localStorage.getItem("patient_jwt_token");
      if (!token) {
        setError("Please log in to view profile.");
        setLoading(false);
        return;
      }
      try {
        const response = await fetch("http://127.0.0.1:8000/patient/profile", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          // Map backend schema to UI format
          const formatted = {
            id: data.token,
            name: data.name,
            avatar: data.name.charAt(0).toUpperCase(),
            dob: data.date_of_birth || "Not specified",
            phone: data.phone,
            email: data.email,
            memberSince: data.created_at ? new Date(data.created_at).toLocaleDateString("en-IN", {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : "Recently",
            registeredVia: "Online Portal",
            address: [data.address_line1, data.city, data.state, data.pincode].filter(Boolean).join(", ") || "No address provided",
            insurance: { provider: "Not provided", policyId: "N/A", coverage: 0 },
            emergencyContact: {
              name: data.emergency_contact_name || "Not specified",
              relation: "Contact",
              phone: data.emergency_contact_phone || "Not specified"
            },
          };
          setPatient(formatted);
        } else {
          setError("Failed to load profile details.");
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("An error occurred loading profile.");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSave = (updatedData) => {
    setPatient(updatedData);
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 mt-4">Loading profile...</p>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-10 bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
        <p className="text-sm text-gray-700 font-semibold">{error || "Profile not loaded."}</p>
        <Link
          href="/login"
          className="inline-block px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-sm"
        >
          Go to Login
        </Link>
      </div>
    );
  }

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
          <PatientSecurityCard />
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
