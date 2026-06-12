"use client";

import { useState } from "react";
import ProfileHeader from "@/components/ui/patients/profile/profileHeader";
import ProfileSection from "@/components/ui/patients/profile/profileSection";
import InsuranceCard from "@/components/ui/patients/profile/insuranceCard";
import EditProfileModal from "@/components/ui/patients/profile/editProfileModal";

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
          <p className="text-sm text-gray-500 mt-1">
            Manage your personal data, contact information, and insurance policies.
          </p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30"
        >
          ✏️ Edit Profile
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
import { User, Shield, Phone, Edit, Check, X, AlertCircle } from "lucide-react";

export default function PatientProfilePage() {
  const [profile, setProfile] = useState({
    name: "Rahul Kumar",
    dob: "1990-04-15",
    phone: "+91 98765 43210",
    email: "rahul@example.com",
    address: "12, Regency Heights, MG Road, Bangalore - 560001",
    memberSince: "2022-08-10",
    insuranceProvider: "Star Health",
    policyId: "SH-2024-991",
    coverage: 70,
    emergencyName: "Priya Kumar",
    emergencyRelation: "Spouse",
    emergencyPhone: "+91 91234 56789"
  });

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({ ...profile });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    setProfile({ ...formData });
    setEditMode(false);
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 3000);
  };

  const handleCancel = () => {
    setFormData({ ...profile });
    setEditMode(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and manage your personal demographics, health insurance, and emergency contact settings.
          </p>
        </div>
        <div>
          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="bg-primary text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-primary/90 shadow-sm shadow-primary/30 transition-all flex items-center gap-2 cursor-pointer outline-none"
            >
              <Edit className="w-4 h-4" /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="bg-success text-white rounded-xl px-4 py-2 text-sm font-semibold hover:bg-success/90 shadow-sm shadow-success/30 transition-all flex items-center gap-1.5 cursor-pointer outline-none"
              >
                <Check className="w-4 h-4" /> Save
              </button>
              <button
                onClick={handleCancel}
                className="bg-white text-gray-700 border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-1.5 cursor-pointer outline-none"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {saveSuccess && (
        <div className="bg-success/10 border border-success/20 text-success p-4 rounded-xl flex items-center gap-3 text-sm animate-bounce">
          <Check className="w-5 h-5 rounded-full bg-success/20 p-0.5" />
          <span>Profile saved successfully! Your details have been updated.</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Personal Demographics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <User className="w-5 h-5 text-primary" /> Personal Demographics
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Full Name</label>
                {editMode ? (
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full text-sm font-medium border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-800">{profile.name}</span>
                )}
              </div>
              
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Date of Birth</label>
                {editMode ? (
                  <input
                    type="date"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full text-sm font-medium border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-800">{profile.dob}</span>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Mobile Contact</label>
                {editMode ? (
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full text-sm font-medium border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-800">{profile.phone}</span>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Email Address</label>
                {editMode ? (
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full text-sm font-medium border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-800">{profile.email}</span>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs font-semibold text-gray-400 block mb-1">Residential Address</label>
                {editMode ? (
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full text-sm font-medium border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none resize-none"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-850 leading-relaxed block">{profile.address}</span>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-405 block mb-1">Member Since</label>
                <span className="text-sm font-bold text-gray-500">{profile.memberSince}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Info Panels (Insurance & Emergency) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Insurance Information */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Shield className="w-5 h-5 text-secondary" /> Health Insurance
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Provider Name</label>
                {editMode ? (
                  <input
                    type="text"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleInputChange}
                    className="w-full text-sm font-medium border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-800">{profile.insuranceProvider}</span>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Policy Number</label>
                {editMode ? (
                  <input
                    type="text"
                    name="policyId"
                    value={formData.policyId}
                    onChange={handleInputChange}
                    className="w-full text-sm font-medium border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-800">{profile.policyId}</span>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Co-Pay / Coverage (%)</label>
                {editMode ? (
                  <input
                    type="number"
                    name="coverage"
                    value={formData.coverage}
                    onChange={handleInputChange}
                    className="w-full text-sm font-medium border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">{profile.coverage}% coverage</span>
                    <span className="text-[10px] bg-secondary/15 text-secondary px-2 py-0.5 rounded font-black">Active</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
              <Phone className="w-5 h-5 text-danger" /> Emergency Contact
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Contact Name</label>
                {editMode ? (
                  <input
                    type="text"
                    name="emergencyName"
                    value={formData.emergencyName}
                    onChange={handleInputChange}
                    className="w-full text-sm font-medium border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-800">{profile.emergencyName}</span>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Relation</label>
                {editMode ? (
                  <input
                    type="text"
                    name="emergencyRelation"
                    value={formData.emergencyRelation}
                    onChange={handleInputChange}
                    className="w-full text-sm font-medium border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-800">{profile.emergencyRelation}</span>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 block mb-1">Phone Number</label>
                {editMode ? (
                  <input
                    type="text"
                    name="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    className="w-full text-sm font-medium border border-gray-200 rounded-lg p-2 focus:border-primary focus:outline-none"
                  />
                ) : (
                  <span className="text-sm font-bold text-gray-805">{profile.emergencyPhone}</span>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
