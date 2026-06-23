"use client";

import { useState, useEffect } from "react";
import { X, Shield, Lock, User, Mail } from "lucide-react";

export default function CreateUserModal({ isOpen, onClose, onCreateUser, editUser, onEditUser }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedSpecialties, setSelectedSpecialties] = useState([]);
  const [password, setPassword] = useState("");
  const [dob, setDob] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [licenceId, setLicenceId] = useState("");
  const [chairSetup, setChairSetup] = useState("");
  const [board, setBoard] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (editUser) {
        const mappedRoles = (editUser.roles || []).map((r) => {
          const lower = r.toLowerCase();
          if (lower === "lab tech") return "lab";
          return lower;
        });
        const timer = setTimeout(() => {
          setName(editUser.name || "");
          setEmail(editUser.email || "");
          setSelectedRoles(mappedRoles);
          setSelectedSpecialties(editUser.specialties || []);
          setPassword("");
          setDob(editUser.dob || "");
          setPhone(editUser.phone || "");
          setAddress(editUser.address || "");
          setLicenceId(editUser.licence_id || "");
          setChairSetup(editUser.chair_setup || "");
          setBoard(editUser.board || "");
        }, 0);
        return () => clearTimeout(timer);
      } else {
        const timer = setTimeout(() => {
          setName("");
          setEmail("");
          setSelectedRoles([]);
          setSelectedSpecialties([]);
          setPassword("");
          setDob("");
          setPhone("");
          setAddress("");
          setLicenceId("");
          setChairSetup("");
          setBoard("");
        }, 0);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, editUser]);

  if (!isOpen) return null;

  const handleRoleToggle = (roleVal) => {
    setSelectedRoles((prev) => {
      const isExist = prev.includes(roleVal);
      let updated = [];
      if (isExist) {
        updated = prev.filter((r) => r !== roleVal);
      } else {
        // Limit Doctor/Admin/Lab to not conflict, but allow receptionist and accountant combinations
        if (roleVal === "doctor" || roleVal === "admin" || roleVal === "lab") {
          updated = [roleVal]; // Clear others if specific role is picked
          setSelectedSpecialties([]);
        } else {
          // If receptionist/accountant is clicked, clear admin/doctor/lab
          const filtered = prev.filter(r => r !== "admin" && r !== "doctor" && r !== "lab");
          updated = [...filtered, roleVal];
        }
      }
      return updated;
    });
  };

  const handleSpecialtyToggle = (spec) => {
    setSelectedSpecialties((prev) =>
      prev.includes(spec) ? prev.filter((s) => s !== spec) : [...prev, spec]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;
    if (!editUser && !password.trim()) return;
    
    if (selectedRoles.length === 0) {
      alert("Please select at least one role/module access.");
      return;
    }

    if (selectedRoles.includes("doctor") && selectedSpecialties.length === 0) {
      alert("Please select at least one doctor specialty.");
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim(),
      roles: selectedRoles,
      specialties: selectedRoles.includes("doctor") ? selectedSpecialties : [],
      dob: dob.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      licence_id: selectedRoles.includes("doctor") ? (licenceId.trim() || null) : null,
      chair_setup: selectedRoles.includes("doctor") ? (chairSetup.trim() || null) : null,
      board: selectedRoles.includes("doctor") ? (board.trim() || null) : null
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    if (editUser) {
      onEditUser(editUser.id, payload);
    } else {
      onCreateUser(payload);
    }

    // Reset fields
    setName("");
    setEmail("");
    setSelectedRoles([]);
    setSelectedSpecialties([]);
    setPassword("");
    onClose();
  };

  const availableRoles = [
    { value: "admin", label: "Admin" },
    { value: "doctor", label: "Doctor" },
    { value: "receptionist", label: "Receptionist" },
    { value: "accountant", label: "Accountant" },
    { value: "lab", label: "Lab Technician" }
  ];

  const availableSpecialties = [
    "General Dentistry",
    "Endodontics",
    "Orthodontics",
    "Periodontics",
    "Oral Surgery",
    "Prosthodontics"
  ];

  const hasDoctor = selectedRoles.includes("doctor");
  const isFrontDesk = selectedRoles.includes("receptionist") || selectedRoles.includes("accountant");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 text-left border border-gray-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-base font-extrabold text-gray-950">{editUser ? "Edit Staff Member" : "Register New Staff"}</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">{editUser ? "Update Authentication & Roles" : "Clinic Member Authentication"}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-full cursor-pointer outline-none"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4 max-h-[480px] overflow-y-auto">
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Full Name</label>
              <div className="relative flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <User className="absolute left-3 w-4 h-4 text-gray-400" />
                <input 
                  type="text" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400 font-semibold"
                  placeholder="e.g. Dr. Sarah Jenkins"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Email Address</label>
              <div className="relative flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <Mail className="absolute left-3 w-4 h-4 text-gray-400" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400 font-semibold"
                  placeholder="name@smilecare.com"
                />
              </div>
            </div>

            {/* Role / Module Access Checkboxes */}
            <div className="space-y-2">
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Module Role Access</label>
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
                <div className="grid grid-cols-2 gap-2">
                  {availableRoles.map((roleOpt) => {
                    const isChecked = selectedRoles.includes(roleOpt.value);
                    return (
                      <label key={roleOpt.value} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleRoleToggle(roleOpt.value)}
                          className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-200 cursor-pointer outline-none"
                        />
                        <span className="text-xs font-semibold text-gray-650">{roleOpt.label}</span>
                      </label>
                    );
                  })}
                </div>
                {isFrontDesk && (
                  <div className="pt-2 border-t border-dashed border-gray-200 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    💡 Can combine Receptionist & Accountant roles
                  </div>
                )}
              </div>
            </div>

            {/* DOCTOR DYNAMIC SPECIALTY FIELD */}
            {hasDoctor && (
              <div className="space-y-3.5 p-4 bg-gray-50 border border-gray-150 rounded-xl animate-in fade-in duration-200">
                <div className="space-y-2">
                  <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2">Doctor Specialties</label>
                  <div className="grid grid-cols-2 gap-3.5">
                    {availableSpecialties.map((spec) => {
                      const isChecked = selectedSpecialties.includes(spec);
                      return (
                        <label key={spec} className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleSpecialtyToggle(spec)}
                            className="w-4 h-4 rounded text-primary focus:ring-primary border-gray-200 cursor-pointer outline-none"
                          />
                          <span className="text-xs font-semibold text-gray-650">{spec}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {selectedSpecialties.length > 0 ? (
                  <div className="pt-3 border-t border-dashed border-gray-200 text-xs text-gray-600 font-semibold">
                    <span>Authorized Dashboards:</span>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {selectedSpecialties.map((spec) => (
                        <span key={spec} className="bg-primary/10 text-primary text-[9px] font-black uppercase px-2 py-0.5 rounded">
                          🩺 {spec} View
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-rose-500 font-bold mt-1">⚠️ Please assign at least one specialty dashboard.</p>
                )}
              </div>
            )}

            {/* DOCTOR DYNAMIC PROFILE DETAILS */}
            {hasDoctor && (
              <div className="space-y-4 p-4 bg-gray-50 border border-gray-150 rounded-xl animate-in fade-in duration-200">
                <h4 className="text-[10px] uppercase font-bold text-primary tracking-wider">Doctor Credentials & Profile</h4>
                
                <div className="grid grid-cols-2 gap-2">
                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Phone Number</label>
                    <input 
                      type="text" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 outline-none focus:border-primary font-semibold"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  {/* DOB */}
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Date of Birth</label>
                    <input 
                      type="date" 
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 outline-none focus:border-primary font-semibold"
                    />
                  </div>
                </div>

                {/* Licence ID & Chair Setup */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">License ID</label>
                    <input 
                      type="text" 
                      value={licenceId}
                      onChange={(e) => setLicenceId(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 outline-none focus:border-primary font-semibold"
                      placeholder="e.g. DENT-12345"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Chair / Operatory</label>
                    <input 
                      type="text" 
                      value={chairSetup}
                      onChange={(e) => setChairSetup(e.target.value)}
                      className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 outline-none focus:border-primary font-semibold"
                      placeholder="e.g. Chair 3 (Clinical A)"
                    />
                  </div>
                </div>

                {/* Board Certification */}
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Dental Board / Council</label>
                  <input 
                    type="text" 
                    value={board}
                    onChange={(e) => setBoard(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 outline-none focus:border-primary font-semibold"
                    placeholder="e.g. Dental Council of India"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <label className="block text-[9px] uppercase font-bold text-gray-400 tracking-wider">Clinic / Residential Address</label>
                  <textarea 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-white rounded-lg border border-gray-200 text-xs text-gray-800 outline-none focus:border-primary font-semibold resize-none"
                    placeholder="Full residential or work address..."
                  />
                </div>
              </div>
            )}

            {/* Dynamic frontdesk role validation note */}
            {isFrontDesk && !hasDoctor && (
              <div className="p-3.5 bg-sky-50 border border-sky-100 rounded-xl text-xs text-gray-600 font-semibold animate-in fade-in duration-200">
                <span>Authorized Modules:</span>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {selectedRoles.includes("receptionist") && (
                    <span className="bg-secondary/15 text-secondary text-[9px] font-black uppercase px-2 py-0.5 rounded border border-secondary/10">
                      🗝️ Receptionist Dashboard
                    </span>
                  )}
                  {selectedRoles.includes("accountant") && (
                    <span className="bg-indigo-50 border border-indigo-150 text-indigo-700 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                      🗝️ Accountant Dashboard
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Password */}
            <div className="space-y-1">
              <label className="block text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                {editUser ? "New Password (Optional)" : "Temporary Password"}
              </label>
              <div className="relative flex items-center bg-gray-50 rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <Lock className="absolute left-3 w-4 h-4 text-gray-400" />
                <input 
                  type="password" 
                  required={!editUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-transparent text-xs text-gray-800 outline-none placeholder:text-gray-400 font-semibold"
                  placeholder={editUser ? "Leave empty to keep current" : "••••••••"}
                />
              </div>
              <p className="text-[10px] text-gray-400 font-semibold mt-1">
                {editUser ? "Leave blank to keep existing password." : "Forced credentials reset required on initial staff login."}
              </p>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="p-5 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4.5 py-2 text-xs font-bold text-gray-650 bg-white border border-gray-250 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer outline-none"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4.5 py-2 text-xs font-bold text-white bg-primary rounded-xl hover:bg-primary/95 transition-all shadow-md shadow-primary/15 cursor-pointer outline-none"
            >
              {editUser ? "Save Changes" : "Create User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
