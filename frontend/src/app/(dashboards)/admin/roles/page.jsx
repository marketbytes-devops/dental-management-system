"use client";

import { useState } from "react";
import { 
  Key, 
  BarChart3, 
  Calendar, 
  Users, 
  Stethoscope, 
  FileText, 
  Microscope, 
  Coins, 
  FileEdit,
  Check,
  X,
  ShieldAlert,
  Save,
  RotateCcw
} from "lucide-react";

export default function RolesPermissionsPage() {
  // Modules definitions
  const modules = [
    { id: "dashboard", name: "Dashboard", desc: "Access to the main analytics and overview dashboards.", icon: BarChart3 },
    { id: "appointments", name: "Appointments", desc: "View, book, reschedule and cancel patient appointments.", icon: Calendar },
    { id: "patients", name: "Patient Registry", desc: "View, search, and register patient clinical profiles and files.", icon: Users },
    { id: "notes", name: "Clinical Notes", desc: "Add clinical diagnoses and edit interactive tooth charts.", icon: Stethoscope },
    { id: "rx", name: "Prescriptions", desc: "Draft, print, and save medications for active chair patients.", icon: FileText },
    { id: "labs", name: "Lab Orders", desc: "Submit and track restorative orders sent to external milling labs.", icon: Microscope },
    { id: "billing", name: "Billing & Accountant", desc: "Manage invoices, payments, claims, and financial logs.", icon: Coins }
  ];

  // Default database states for each role
  const defaultRolesPermissions = {
    Admin: {
      scope: "Full authorization across all CLM features.",
      permissions: {
        dashboard: { read: true, write: true, delete: true },
        appointments: { read: true, write: true, delete: true },
        patients: { read: true, write: true, delete: true },
        notes: { read: true, write: true, delete: true },
        rx: { read: true, write: true, delete: true },
        labs: { read: true, write: true, delete: true },
        billing: { read: true, write: true, delete: true }
      }
    },
    Doctor: {
      scope: "Manage clinical files, tooth charts, and daily prescriptions.",
      permissions: {
        dashboard: { read: true, write: true, delete: false },
        appointments: { read: true, write: true, delete: false },
        patients: { read: true, write: true, delete: false },
        notes: { read: true, write: true, delete: false },
        rx: { read: true, write: true, delete: false },
        labs: { read: true, write: true, delete: false },
        billing: { read: true, write: false, delete: false }
      }
    },
    Receptionist: {
      scope: "Coordinate check-ins, manage lobby waiting list, and book appointments.",
      permissions: {
        dashboard: { read: true, write: false, delete: false },
        appointments: { read: true, write: true, delete: true },
        patients: { read: true, write: true, delete: false },
        notes: { read: false, write: false, delete: false },
        rx: { read: false, write: false, delete: false },
        labs: { read: false, write: false, delete: false },
        billing: { read: true, write: true, delete: false }
      }
    },
    "Lab Tech": {
      scope: "Validate crown shade specifications, dispatch cases, and monitor lines.",
      permissions: {
        dashboard: { read: true, write: false, delete: false },
        appointments: { read: false, write: false, delete: false },
        patients: { read: true, write: false, delete: false },
        notes: { read: true, write: false, delete: false },
        rx: { read: false, write: false, delete: false },
        labs: { read: true, write: true, delete: false },
        billing: { read: false, write: false, delete: false }
      }
    },
    Accountant: {
      scope: "Access billing audits, invoice approvals, refund validation, and payroll.",
      permissions: {
        dashboard: { read: true, write: false, delete: false },
        appointments: { read: false, write: false, delete: false },
        patients: { read: true, write: false, delete: false },
        notes: { read: false, write: false, delete: false },
        rx: { read: false, write: false, delete: false },
        labs: { read: true, write: false, delete: false },
        billing: { read: true, write: true, delete: true }
      }
    }
  };

  const [rolesData, setRolesData] = useState(defaultRolesPermissions);
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [toastMessage, setToastMessage] = useState("");

  // Helper: Calculate total actions count & percentage for a role
  const getRoleMetrics = (role) => {
    const rolePermissionsObj = rolesData[role].permissions;
    let authorizedCount = 0;
    const totalCount = modules.length * 3; // 7 modules * 3 permissions (Read, Write, Delete) = 21

    Object.values(rolePermissionsObj).forEach(perms => {
      if (perms.read) authorizedCount++;
      if (perms.write) authorizedCount++;
      if (perms.delete) authorizedCount++;
    });

    const percent = Math.round((authorizedCount / totalCount) * 100);
    return { authorizedCount, totalCount, percent };
  };

  // Toggle permission cell
  const handleToggle = (role, moduleId, permType) => {
    if (role === "Admin") return; // Admin permissions cannot be edited in mock
    setRolesData(prev => ({
      ...prev,
      [role]: {
        ...prev[role],
        permissions: {
          ...prev[role].permissions,
          [moduleId]: {
            ...prev[role].permissions[moduleId],
            [permType]: !prev[role].permissions[moduleId][permType]
          }
        }
      }
    }));
  };

  // Action: All Read
  const handleAllRead = () => {
    if (selectedRole === "Admin") return;
    setRolesData(prev => {
      const updatedPermissions = { ...prev[selectedRole].permissions };
      Object.keys(updatedPermissions).forEach(modId => {
        updatedPermissions[modId] = { ...updatedPermissions[modId], read: true };
      });
      return {
        ...prev,
        [selectedRole]: { ...prev[selectedRole], permissions: updatedPermissions }
      };
    });
  };

  // Action: Clear Delete
  const handleClearDelete = () => {
    if (selectedRole === "Admin") return;
    setRolesData(prev => {
      const updatedPermissions = { ...prev[selectedRole].permissions };
      Object.keys(updatedPermissions).forEach(modId => {
        updatedPermissions[modId] = { ...updatedPermissions[modId], delete: false };
      });
      return {
        ...prev,
        [selectedRole]: { ...prev[selectedRole], permissions: updatedPermissions }
      };
    });
  };

  // Action: Reset Default
  const handleResetDefault = () => {
    setRolesData(prev => ({
      ...prev,
      [selectedRole]: {
        ...prev[selectedRole],
        permissions: defaultRolesPermissions[selectedRole].permissions
      }
    }));
    setToastMessage(`Reset "${selectedRole}" to default permissions.`);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Action: Save All Changes
  const handleSaveAll = () => {
    setToastMessage("All permission adjustments saved successfully!");
    setTimeout(() => setToastMessage(""), 3000);
  };

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans">
      
      {/* Title & Subtitle Banner */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Key className="w-6 h-6 text-primary" /> Manage Permissions
          </h1>
          <p className="text-xs font-semibold text-gray-400 mt-1">
            Configure feature authorization level policies for each system role.
          </p>
        </div>
        <div>
          <button
            onClick={handleSaveAll}
            className="bg-primary hover:bg-primary/95 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all shadow-md shadow-primary/20 hover:scale-102 cursor-pointer flex items-center gap-1.5 outline-none"
          >
            <Save className="w-4 h-4" /> Save All Changes
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3.5 rounded-xl text-xs font-bold animate-pulse flex items-center gap-2">
          <span>✓</span> {toastMessage}
        </div>
      )}

      {/* HORIZONTAL CARDS: Roles Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {Object.keys(rolesData).map((role) => {
          const { authorizedCount, totalCount, percent } = getRoleMetrics(role);
          const isSelected = selectedRole === role;
          return (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col justify-between items-start cursor-pointer hover:shadow-xs outline-none ${
                isSelected 
                  ? "border-primary bg-white shadow-xs ring-2 ring-primary/10" 
                  : "border-gray-150 bg-white hover:border-gray-300"
              }`}
            >
              <div className="w-full flex justify-between items-start">
                <span className="text-xs font-black uppercase text-gray-900 tracking-wider">
                  {role} ROLE
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                  percent === 100 
                    ? "bg-emerald-100 text-emerald-800" 
                    : percent > 40 
                      ? "bg-sky-100 text-sky-800" 
                      : "bg-amber-100 text-amber-800"
                }`}>
                  {percent}% Active
                </span>
              </div>
              
              <p className="text-[10px] text-gray-400 font-bold mt-2 leading-relaxed line-clamp-2 h-7.5 w-full">
                {rolesData[role].scope}
              </p>

              {/* Progress Bar */}
              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-3">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    percent === 100 ? "bg-emerald-500" : percent > 40 ? "bg-primary" : "bg-warning"
                  }`} 
                  style={{ width: `${percent}%` }}
                ></div>
              </div>

              <div className="w-full flex justify-between items-center text-[9px] font-bold text-gray-400 mt-2">
                <span>Total Actions:</span>
                <span className="text-gray-700">{authorizedCount} of {totalCount}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* MAIN CONTAINER: Feature Grid */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs p-6 space-y-6">
        
        {/* Selected Role Header & Bulk actions */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-100 pb-5 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-black uppercase shadow-inner">
              {selectedRole.charAt(0)}
            </div>
            <div>
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                {selectedRole} Permissions
              </h2>
              <p className="text-xs font-semibold text-gray-400 mt-0.5">{rolesData[selectedRole].scope}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAllRead}
              disabled={selectedRole === "Admin"}
              className="text-[11px] font-black text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              All Read
            </button>
            <span className="text-gray-300 text-xs">|</span>
            <button
              onClick={handleClearDelete}
              disabled={selectedRole === "Admin"}
              className="text-[11px] font-black text-primary hover:text-primary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              Clear Del
            </button>
            <span className="text-gray-300 text-xs">|</span>
            <button
              onClick={handleResetDefault}
              className="text-[11px] font-black text-primary hover:text-primary/80 transition-colors cursor-pointer flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset Default
            </button>
            
            {/* Status Badge */}
            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg ml-2 ${
              getRoleMetrics(selectedRole).percent === 100 
                ? "bg-emerald-100 text-emerald-800" 
                : "bg-primary/10 text-primary"
            }`}>
              {getRoleMetrics(selectedRole).percent}% Authorized ({getRoleMetrics(selectedRole).authorizedCount} of {getRoleMetrics(selectedRole).totalCount})
            </span>
          </div>
        </div>

        {/* Feature Permissions Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-150/70 text-[10px] font-extrabold text-gray-400 uppercase tracking-widest bg-gray-50/10">
                <th className="py-3 px-4">Feature Module</th>
                <th className="py-3 px-4 text-center w-28">Read (R)</th>
                <th className="py-3 px-4 text-center w-28">Write (W)</th>
                <th className="py-3 px-4 text-center w-28">Delete (D)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {modules.map((mod) => {
                const docPerm = rolesData[selectedRole].permissions[mod.id] || { read: false, write: false, delete: false };
                const IconComponent = mod.icon;

                return (
                  <tr key={mod.id} className="hover:bg-gray-50/30 transition-colors group">
                    <td className="py-4.5 px-4 flex items-start gap-3.5">
                      <div className="w-9 h-9 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-500 group-hover:text-primary group-hover:bg-primary/5 transition-colors shrink-0 shadow-inner mt-0.5">
                        <IconComponent className="w-4.5 h-4.5" />
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-black text-gray-900 group-hover:text-primary transition-colors">{mod.name}</h4>
                        <p className="text-xs text-gray-400 mt-0.5 leading-relaxed font-semibold">{mod.desc}</p>
                      </div>
                    </td>

                    {/* READ (R) Column Toggle Button */}
                    <td className="py-4.5 px-4 text-center">
                      <button
                        onClick={() => handleToggle(selectedRole, mod.id, "read")}
                        disabled={selectedRole === "Admin"}
                        className={`mx-auto w-6.5 h-6.5 rounded-full flex items-center justify-center border transition-all outline-none ${
                          docPerm.read 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm" 
                            : "bg-rose-50 border-rose-100 text-rose-500 shadow-sm"
                        } ${selectedRole === "Admin" ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:scale-105"}`}
                      >
                        {docPerm.read ? (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        ) : (
                          <X className="w-3 h-3" strokeWidth={3} />
                        )}
                      </button>
                    </td>

                    {/* WRITE (W) Column Toggle Button */}
                    <td className="py-4.5 px-4 text-center">
                      <button
                        onClick={() => handleToggle(selectedRole, mod.id, "write")}
                        disabled={selectedRole === "Admin"}
                        className={`mx-auto w-6.5 h-6.5 rounded-full flex items-center justify-center border transition-all outline-none ${
                          docPerm.write 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm" 
                            : "bg-rose-50 border-rose-100 text-rose-500 shadow-sm"
                        } ${selectedRole === "Admin" ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:scale-105"}`}
                      >
                        {docPerm.write ? (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        ) : (
                          <X className="w-3 h-3" strokeWidth={3} />
                        )}
                      </button>
                    </td>

                    {/* DELETE (D) Column Toggle Button */}
                    <td className="py-4.5 px-4 text-center">
                      <button
                        onClick={() => handleToggle(selectedRole, mod.id, "delete")}
                        disabled={selectedRole === "Admin"}
                        className={`mx-auto w-6.5 h-6.5 rounded-full flex items-center justify-center border transition-all outline-none ${
                          docPerm.delete 
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600 shadow-sm" 
                            : "bg-rose-50 border-rose-100 text-rose-500 shadow-sm"
                        } ${selectedRole === "Admin" ? "cursor-not-allowed opacity-80" : "cursor-pointer hover:scale-105"}`}
                      >
                        {docPerm.delete ? (
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                        ) : (
                          <X className="w-3 h-3" strokeWidth={3} />
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
