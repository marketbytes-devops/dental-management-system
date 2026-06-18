"use client";

import { useState, useEffect } from "react";
import CreateUserModal from "@/components/admin/CreateUserModal";
import { Users, Search, UserPlus } from "lucide-react";

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  const defaultUsers = [
    { id: 1, name: "Dr. Anoop Nair", roles: ["Doctor"], specialties: ["Endodontics"], email: "anoop@smilecare.com", status: "Active" },
    { id: 2, name: "Sneha Thomas", roles: ["Receptionist"], specialties: [], email: "sneha@smilecare.com", status: "Active" },
    { id: 3, name: "Rahul Kumar", roles: ["Patient"], specialties: [], email: "rahul@example.com", status: "Active" },
    { id: 4, name: "Anita Sharma", roles: ["Lab Tech"], specialties: [], email: "anita@smilecare.com", status: "Inactive" },
  ];

  const [users, setUsers] = useState([]);

  const fetchUsers = async () => {
    try {
      const response = await fetch("http://localhost:8000/admin/users");
      if (!response.ok) throw new Error("Failed to load users.");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      console.error(err);
      // Resilient fallback to localStorage
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("smilecare_users");
        if (saved) {
          try {
            setUsers(JSON.parse(saved));
            return;
          } catch (e) {}
        }
      }
      setUsers(defaultUsers);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (newUser) => {
    const formattedRoles = newUser.roles.map(r => 
      r === "doctor" ? "Doctor" : 
      r === "lab" ? "Lab Tech" :
      r === "receptionist" ? "Receptionist" :
      r === "accountant" ? "Accountant" :
      r.charAt(0).toUpperCase() + r.slice(1)
    );

    try {
      const response = await fetch("http://localhost:8000/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          roles: formattedRoles,
          specialties: newUser.specialties || []
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to create user.");
      }

      setToastMessage(`User "${newUser.name}" successfully registered!`);
      setTimeout(() => setToastMessage(""), 3000);
      fetchUsers();
    } catch (err) {
      alert(err.message || "An error occurred while creating the user.");
    }
  };

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case "doctor": return "bg-primary/10 text-primary border border-primary/20";
      case "receptionist": return "bg-secondary/10 text-secondary border border-secondary/20";
      case "lab tech": return "bg-warning/10 text-warning border border-warning/20";
      case "patient": return "bg-gray-100 text-gray-600 border border-gray-200";
      case "accountant": return "bg-indigo-50 border border-indigo-150 text-indigo-700";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  const toggleStatus = async (id) => {
    try {
      const response = await fetch(`http://localhost:8000/admin/users/${id}/status`, {
        method: "PUT"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update status.");
      }

      fetchUsers();
    } catch (err) {
      alert(err.message || "An error occurred while updating user status.");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(search.toLowerCase()) || 
                          user.email.toLowerCase().includes(search.toLowerCase()) ||
                          (user.specialties && user.specialties.some(s => s.toLowerCase().includes(search.toLowerCase())));
    
    const matchesRole = roleFilter === "" || (user.roles && user.roles.some(r => 
      r.toLowerCase() === roleFilter.toLowerCase() || 
      (roleFilter === "lab" && r === "Lab Tech")
    ));
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 text-left animate-fade-in font-sans">
      
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" /> User Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">Manage system accounts, practitioners, and dashboard configurations.</p>
        </div>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4.5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary/95 transition-all shadow-md shadow-primary/10 flex items-center gap-1.5 cursor-pointer outline-none hover:scale-102"
        >
          <UserPlus className="w-4 h-4" /> Add New Staff
        </button>
      </div>

      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs font-bold animate-pulse flex items-center gap-2">
          <span>✓</span> {toastMessage}
        </div>
      )}

      {/* Directory Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
        
        {/* Filters bar */}
        <div className="p-4 border-b border-gray-100 bg-gray-50/20 flex gap-3 flex-wrap">
          <div className="relative flex items-center bg-white border border-gray-200 rounded-xl px-3 py-1.5 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary w-64 transition-all">
            <Search className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
            <input 
              type="text" 
              placeholder="Search by name, email or specialty..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none text-xs w-full placeholder:text-gray-400 text-gray-800"
            />
          </div>

          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary text-gray-700 cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="doctor">Doctor</option>
            <option value="receptionist">Receptionist</option>
            <option value="lab">Lab Tech</option>
            <option value="accountant">Accountant</option>
            <option value="patient">Patient</option>
          </select>
        </div>

        {/* Users Roster Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Staff Member</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Role / Module Access</th>
                <th className="px-6 py-4">Authentication Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group text-sm">
                  <td className="px-6 py-4.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8.5 h-8.5 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs shadow-inner">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <span className="font-extrabold text-gray-900 block">{user.name}</span>
                        {user.roles && user.roles.includes("Doctor") && user.specialties && user.specialties.length > 0 && (
                          <span className="text-[10px] text-primary font-bold uppercase tracking-wider block mt-0.5">
                            Specialties: {user.specialties.join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4.5 text-gray-500 font-semibold text-xs">{user.email}</td>
                  <td className="px-6 py-4.5">
                    <div className="flex flex-wrap gap-1">
                      {user.roles && user.roles.map((r, i) => (
                        <span key={i} className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${getRoleColor(r)}`}>
                          {r}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4.5">
                    <span className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${user.status === "Active" ? "bg-emerald-500" : "bg-gray-300"}`}></span>
                      <span className="text-xs font-semibold text-gray-600">{user.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4.5 text-right">
                    <button 
                      onClick={() => toggleStatus(user.id)}
                      className="text-gray-400 hover:text-primary transition-colors px-2 text-xs font-bold cursor-pointer outline-none"
                    >
                      {user.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                    <button 
                      onClick={() => alert(`Editing profile data for ${user.name}...`)}
                      className="text-gray-400 hover:text-gray-600 transition-colors px-2 text-xs font-bold cursor-pointer outline-none"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400 font-semibold italic border-t border-gray-100">
                    No users matching selected query found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Creation Modal Overlay */}
      <CreateUserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreateUser={handleCreateUser}
      />
    </div>
  );
}
