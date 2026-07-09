"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Key, Eye, EyeOff, ShieldCheck, User, Mail, Phone, Calendar, MapPin, Award, Stethoscope, ShieldAlert } from "lucide-react";
import { 
  getProfile, 
  updateProfile, 
  getPatientProfile, 
  updatePatientProfile,
  changePatientPassword,
  uploadProfilePicture,
  uploadPatientProfilePicture
} from "@/services/api";

export default function UnifiedProfile({ role }) {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    dob: "",
    address: "",
    licenceId: "",
    chairSetup: "",
    board: "",
    emergencyName: "",
    emergencyPhone: "",
    insuranceProvider: "",
    insurancePolicyId: ""
  });

  // Password Change State
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    showCurrent: false,
    showNew: false,
    showConfirm: false,
    loading: false,
    error: "",
    success: false
  });

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError("");
      if (role === "patient") {
        const data = await getPatientProfile();
        const formatted = {
          id: data.token || `PT-${data.id}`,
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          dob: data.date_of_birth || "",
          address: data.address_line1 || "",
          memberSince: data.created_at ? new Date(data.created_at).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric"
          }) : "Recently",
          roleDisplay: "Patient",
          emergencyContact: {
            name: data.emergency_contact_name || "Not specified",
            phone: data.emergency_contact_phone || "Not specified"
          },
          insurance: {
            provider: "Not provided",
            policyId: "N/A"
          },
          profilePicture: data.profile_picture || null
        };
        setProfile(formatted);
      } else {
        const data = await getProfile();
        const formatted = {
          id: `ST-${data.id}`,
          name: data.name,
          email: data.email,
          phone: data.phone || "",
          dob: data.dob || "",
          address: data.address || "",
          memberSince: data.created_at ? new Date(data.created_at).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "long",
            day: "numeric"
          }) : "Recently",
          roleDisplay: data.roles && data.roles.length > 0 ? data.roles[0] : "Staff",
          specialties: data.specialties || [],
          licenceId: data.licence_id || "",
          chairSetup: data.chair_setup || "",
          board: data.board || "",
          profilePicture: data.profile_picture || null
        };
        setProfile(formatted);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      setError("Failed to load profile. Please verify your session.");
      if (err.response?.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.clear();
        }
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [role]);

  const handleEditClick = () => {
    setEditForm({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      dob: profile.dob,
      address: profile.address,
      licenceId: profile.licenceId || "",
      chairSetup: profile.chairSetup || "",
      board: profile.board || "",
      emergencyName: profile.emergencyContact?.name || "",
      emergencyPhone: profile.emergencyContact?.phone || "",
      insuranceProvider: profile.insurance?.provider || "",
      insurancePolicyId: profile.insurance?.policyId || ""
    });
    setIsEditing(true);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    try {
      if (role === "patient") {
        const payload = {
          name: editForm.name,
          phone: editForm.phone,
          address_line1: editForm.address,
          emergency_contact_name: editForm.emergencyName || null,
          emergency_contact_phone: editForm.emergencyPhone || null
        };
        const updated = await updatePatientProfile(payload);
        alert("Profile updated successfully!");
        fetchProfileData();
      } else {
        const payload = {
          name: editForm.name,
          email: editForm.email,
          phone: editForm.phone || null,
          dob: editForm.dob || null,
          address: editForm.address || null
        };
        if (role === "doctor") {
          payload.licence_id = editForm.licenceId || null;
          payload.chair_setup = editForm.chairSetup || null;
          payload.board = editForm.board || null;
        }
        const updated = await updateProfile(payload);
        if (typeof window !== "undefined") {
          localStorage.setItem("staff_user", JSON.stringify(updated));
        }
        alert("Profile updated successfully!");
        fetchProfileData();
      }
      setIsEditing(false);
    } catch (err) {
      alert(err.response?.data?.detail || err.message || "Failed to save profile changes.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setSaveLoading(true);
    try {
      let res;
      if (role === "patient") {
        res = await uploadPatientProfilePicture(formData);
      } else {
        res = await uploadProfilePicture(formData);
      }

      setProfile((prev) => ({
        ...prev,
        profilePicture: res.profile_picture,
      }));

      if (role === "patient" && typeof window !== "undefined") {
        localStorage.setItem("patient_profile_picture", res.profile_picture || "");
      } else if (role !== "patient" && typeof window !== "undefined") {
        const stored = localStorage.getItem("staff_user");
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            parsed.profile_picture = res.profile_picture;
            localStorage.setItem("staff_user", JSON.stringify(parsed));
          } catch (err) {
            console.error("Failed to update staff_user in localStorage:", err);
          }
        }
      }

      alert("Profile picture updated successfully!");
    } catch (err) {
      alert(err.response?.data?.detail || err.message || "Failed to upload profile picture.");
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSecurity((prev) => ({ ...prev, error: "", success: false }));

    if (!security.currentPassword) {
      setSecurity((prev) => ({ ...prev, error: "Current password is required." }));
      return;
    }
    if (security.newPassword.length < 6) {
      setSecurity((prev) => ({ ...prev, error: "New password must be at least 6 characters." }));
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      setSecurity((prev) => ({ ...prev, error: "Passwords do not match." }));
      return;
    }

    setSecurity((prev) => ({ ...prev, loading: true }));
    try {
      if (role === "patient") {
        await changePatientPassword({
          current_password: security.currentPassword,
          new_password: security.newPassword
        });
      } else {
        await updateProfile({
          password: security.newPassword
        });
      }
      setSecurity((prev) => ({
        ...prev,
        success: true,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
    } catch (err) {
      setSecurity((prev) => ({
        ...prev,
        error: err.response?.data?.detail || err.message || "Failed to update password."
      }));
    } finally {
      setSecurity((prev) => ({ ...prev, loading: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-sm text-gray-500 mt-4">Loading profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="max-w-md mx-auto text-center space-y-4 py-10 bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
        <p className="text-sm text-gray-700 font-semibold">{error || "Profile not loaded."}</p>
        <button
          onClick={() => router.push("/login")}
          className="inline-block px-5 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 transition-all shadow-sm cursor-pointer"
        >
          Go to Login
        </button>
      </div>
    );
  }

  const personalItems = [
    { label: "Date of Birth", value: profile.dob || "Not Specified", icon: Calendar },
    { label: "Phone Number", value: profile.phone || "Not Specified", icon: Phone },
    { label: "Email Address", value: profile.email, icon: Mail },
    { label: "Residential Address", value: profile.address || "Not Specified", icon: MapPin, fullWidth: true }
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal profile details, credentials, and account security.
          </p>
        </div>
        <button
          onClick={handleEditClick}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary/5 border border-primary/20 text-primary text-sm font-semibold rounded-xl hover:bg-primary hover:text-white hover:border-primary shadow-sm transition-colors cursor-pointer outline-none shrink-0"
        >
          <Pencil className="w-4 h-4" /> Edit Profile
        </button>
      </div>

      {/* Profile Card Header */}
      <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center gap-6">
        <div className="relative group w-20 h-20 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center border border-gray-100">
          {profile.profilePicture ? (
            <img 
              src={profile.profilePicture.startsWith("http") ? profile.profilePicture : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}${profile.profilePicture}`} 
              alt={profile.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-primary font-bold text-3xl">{profile.name.charAt(0).toUpperCase()}</span>
          )}
          
          <label className="absolute inset-0 bg-black/45 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 cursor-pointer">
            <Pencil className="w-5 h-5 text-white" />
            <span className="text-[10px] text-white font-bold mt-1">Upload</span>
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageUpload} 
              disabled={saveLoading}
            />
          </label>
          {saveLoading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
          )}
        </div>
        <div className="text-center md:text-left space-y-1 flex-1">
          <h2 className="text-xl font-bold text-gray-900">{profile.name}</h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary capitalize">
              {profile.roleDisplay}
            </span>
            <span className="text-xs text-gray-400">
              Account ID: {profile.id}
            </span>
          </div>
          <p className="text-xs text-gray-400">Member Since: {profile.memberSince}</p>
        </div>
      </div>

      {/* Main Info Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <User className="w-5 h-5 text-primary shrink-0" />
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Personal Information</h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {personalItems.map((item, idx) => (
                <div key={idx} className={`${item.fullWidth ? "sm:col-span-2" : ""} space-y-1`}>
                  <span className="text-xs font-semibold text-gray-400 block">{item.label}</span>
                  <div className="flex items-start gap-2">
                    <item.icon className="w-4 h-4 text-gray-300 mt-0.5 shrink-0" />
                    <span className="text-gray-700 font-medium break-all">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Security & Password settings */}
          <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
              <Key className="w-5 h-5 text-primary shrink-0" />
              <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Security &amp; Password Settings</h4>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-sm">
              {security.error && (
                <div className="p-3 bg-red-50 text-red-650 rounded-xl text-xs font-semibold leading-normal border border-red-100">
                  {security.error}
                </div>
              )}

              {security.success && (
                <div className="p-3 bg-green-50 text-green-700 rounded-xl text-xs font-semibold flex items-center gap-2 leading-normal border border-green-100">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Password updated successfully!
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-400">Current Password</label>
                <div className="relative flex items-center">
                  <input
                    type={security.showCurrent ? "text" : "password"}
                    value={security.currentPassword}
                    onChange={(e) => setSecurity((prev) => ({ ...prev, currentPassword: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-200 p-2.5 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => setSecurity((prev) => ({ ...prev, showCurrent: !prev.showCurrent }))}
                    className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                  >
                    {security.showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-400">New Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={security.showNew ? "text" : "password"}
                      value={security.newPassword}
                      onChange={(e) => setSecurity((prev) => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-gray-200 p-2.5 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setSecurity((prev) => ({ ...prev, showNew: !prev.showNew }))}
                      className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {security.showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-400">Confirm New Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={security.showConfirm ? "text" : "password"}
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-gray-200 p-2.5 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => setSecurity((prev) => ({ ...prev, showConfirm: !prev.showConfirm }))}
                      className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    >
                      {security.showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={security.loading}
                  className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all shadow-sm focus:outline-none disabled:opacity-50 cursor-pointer text-xs"
                >
                  {security.loading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar / Role-specific cards */}
        <div className="lg:col-span-1 space-y-6">
          {role === "doctor" && (
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Award className="w-5 h-5 text-primary shrink-0" />
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Clinical Credentials</h4>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold text-gray-400 block">Medical Specialty</span>
                  <span className="text-gray-700 font-medium">{profile.specialties.join(" & ") || "General Dentistry"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block">License / Registration ID</span>
                  <span className="text-gray-700 font-medium">{profile.licenceId || "Not Specified"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block">Chair setup / Operatory</span>
                  <span className="text-gray-700 font-medium">{profile.chairSetup || "Not Specified"}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block">Dental Board / Council</span>
                  <span className="text-gray-700 font-medium">{profile.board || "Not Specified"}</span>
                </div>
              </div>
            </div>
          )}

          {role === "patient" && (
            <>
              {/* Emergency Contact */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <ShieldAlert className="w-5 h-5 text-primary shrink-0" />
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Emergency Contact</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 block">Contact Name</span>
                    <span className="text-gray-700 font-medium">{profile.emergencyContact.name}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-400 block">Relationship</span>
                    <span className="text-gray-700 font-medium">Emergency Contact</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-400 block">Phone Number</span>
                    <span className="text-gray-700 font-medium">{profile.emergencyContact.phone}</span>
                  </div>
                </div>
              </div>

              {/* Insurance Info */}
              <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Award className="w-5 h-5 text-primary shrink-0" />
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Insurance Policy</h4>
                </div>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-xs font-semibold text-gray-400 block">Insurance Provider</span>
                    <span className="text-gray-700 font-medium">{profile.insurance.provider}</span>
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-gray-400 block">Policy ID / Number</span>
                    <span className="text-gray-700 font-medium">{profile.insurance.policyId}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Department / Org details for staff */}
          {role !== "doctor" && role !== "patient" && (
            <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                <Award className="w-5 h-5 text-primary shrink-0" />
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Work Profile</h4>
              </div>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs font-semibold text-gray-400 block">Department / Role</span>
                  <span className="text-gray-700 font-medium capitalize">{profile.roleDisplay}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block">Employment Status</span>
                  <span className="text-emerald-600 font-semibold">Active</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-gray-400 block">Workplace Location</span>
                  <span className="text-gray-700 font-medium">SmileCare Main Clinic</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-gray-900">Edit Profile Details</h3>
              <button 
                onClick={() => setIsEditing(false)} 
                className="text-gray-400 hover:text-gray-600 text-2xl font-semibold cursor-pointer outline-none border-none bg-transparent"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    required
                    disabled={role === "patient"} // Patient email update currently not allowed in Pydantic schema
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-gray-50 disabled:text-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                  <input
                    type="text"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    required
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>
                {role !== "patient" && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      value={editForm.dob}
                      onChange={handleEditChange}
                      className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Residential Address</label>
                  <input
                    type="text"
                    name="address"
                    value={editForm.address}
                    onChange={handleEditChange}
                    className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                {role === "doctor" && (
                  <>
                    <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
                      <h4 className="text-sm font-bold text-gray-800 mb-3">Clinical Credentials</h4>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">License ID</label>
                      <input
                        type="text"
                        name="licenceId"
                        value={editForm.licenceId}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Chair / Operatory</label>
                      <input
                        type="text"
                        name="chairSetup"
                        value={editForm.chairSetup}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Dental Board / Council</label>
                      <input
                        type="text"
                        name="board"
                        value={editForm.board}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </>
                )}

                {role === "patient" && (
                  <>
                    <div className="sm:col-span-2 border-t border-gray-100 pt-4 mt-2">
                      <h4 className="text-sm font-bold text-gray-800 mb-3">Emergency Contact</h4>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Contact Name</label>
                      <input
                        type="text"
                        name="emergencyName"
                        value={editForm.emergencyName}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Phone Number</label>
                      <input
                        type="text"
                        name="emergencyPhone"
                        value={editForm.emergencyPhone}
                        onChange={handleEditChange}
                        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-5 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveLoading}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {saveLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
