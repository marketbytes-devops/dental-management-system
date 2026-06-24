"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import DoctorProfileHeader from "@/components/ui/doctor/profile/DoctorProfileHeader";
import DoctorProfileSection from "@/components/ui/doctor/profile/DoctorProfileSection";
import DoctorCredentialsCard from "@/components/ui/doctor/profile/DoctorCredentialsCard";
import SecuritySettingsCard from "@/components/ui/doctor/profile/SecuritySettingsCard";
import EditDoctorProfileModal from "@/components/ui/doctor/profile/EditDoctorProfileModal";

// Initial Mock Data Fallback
const INITIAL_DOCTOR = {
  id: "DR-LOADING",
  name: "Doctor",
  dob: "",
  phone: "",
  email: "",
  memberSince: "Recently",
  registrationMode: "Database Unified Account",
  address: "",
  credentials: {
    specialty: "Dental Specialist",
    department: "Clinical",
    licenceId: "",
    chairSetup: "",
    board: ""
  }
};

export default function DoctorProfilePage() {
  const router = useRouter();
  const [doctor, setDoctor] = useState(INITIAL_DOCTOR);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchProfile = async () => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      const response = await fetch("http://127.0.0.1:8000/auth/profile", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 404) {
          if (typeof window !== "undefined") {
            localStorage.removeItem("staff_jwt_token");
            localStorage.removeItem("staff_user");
          }
          router.push("/login");
          return;
        }
        throw new Error("Failed to load profile.");
      }
      const user = await response.json();

      setDoctor({
        id: `DR-${user.id}`,
        name: user.name,
        dob: user.dob || "",
        phone: user.phone || "",
        email: user.email,
        memberSince: user.created_at ? new Date(user.created_at).toLocaleDateString() : "Recently",
        registrationMode: "Database Unified Account",
        address: user.address || "",
        credentials: {
          specialty: user.specialties && user.specialties.length > 0 ? user.specialties.join(" & ") : "General Dentistry",
          department: user.specialties && user.specialties.length > 0 ? `${user.specialties.join(" & ")} Department` : "Clinical",
          licenceId: user.licence_id || "",
          chairSetup: user.chair_setup || "",
          board: user.board || ""
        }
      });
    } catch (err) {
      console.error("Error loading doctor profile:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSave = async (updatedData) => {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("staff_jwt_token") : null;
      
      const payload = {
        name: updatedData.name,
        email: updatedData.email,
        dob: updatedData.dob || null,
        phone: updatedData.phone || null,
        address: updatedData.address || null,
        licence_id: updatedData.credentials?.licenceId || null,
        chair_setup: updatedData.credentials?.chairSetup || null,
        board: updatedData.credentials?.board || null
      };

      const response = await fetch("http://127.0.0.1:8000/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update profile.");
      }

      const updatedUser = await response.json();
      
      // Update local storage staff_user
      if (typeof window !== "undefined") {
        localStorage.setItem("staff_user", JSON.stringify(updatedUser));
      }

      // Map backend response back to local view state format
      setDoctor({
        id: `DR-${updatedUser.id}`,
        name: updatedUser.name,
        dob: updatedUser.dob || "",
        phone: updatedUser.phone || "",
        email: updatedUser.email,
        memberSince: updatedUser.created_at ? new Date(updatedUser.created_at).toLocaleDateString() : "Recently",
        registrationMode: "Database Unified Account",
        address: updatedUser.address || "",
        credentials: {
          specialty: updatedUser.specialties && updatedUser.specialties.length > 0 ? updatedUser.specialties.join(" & ") : "General Dentistry",
          department: updatedUser.specialties && updatedUser.specialties.length > 0 ? `${updatedUser.specialties.join(" & ")} Department` : "Clinical",
          licenceId: updatedUser.licence_id || "",
          chairSetup: updatedUser.chair_setup || "",
          board: updatedUser.board || ""
        }
      });
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err.message || "An error occurred while updating your profile.");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <span className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></span>
      </div>
    );
  }

  const personalItems = [
    { label: "Date of Birth", value: doctor.dob || "Not Specified" },
    { label: "Phone Number", value: doctor.phone || "Not Specified" },
    { label: "Email Address", value: doctor.email },
    { label: "Residential Address", value: doctor.address || "Not Specified", fullWidth: true },
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
