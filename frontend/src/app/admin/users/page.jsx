"use client";

import { useState } from "react";
import CreateUserModal from "@/components/admin/CreateUserModal";

export default function UsersPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const users = [
    { id: 1, name: "Dr. Anoop Nair", role: "Doctor", email: "anoop@smilecare.com", status: "Active" },
    { id: 2, name: "Sneha Thomas", role: "Receptionist", email: "sneha@smilecare.com", status: "Active" },
    { id: 3, name: "Rahul Kumar", role: "Patient", email: "rahul@example.com", status: "Active" },
    { id: 4, name: "Anita Sharma", role: "Lab Tech", email: "anita@smilecare.com", status: "Inactive" },
  ];

  const getRoleColor = (role) => {
    switch (role.toLowerCase()) {
      case "doctor": return "bg-primary/10 text-primary";
      case "receptionist": return "bg-secondary/10 text-secondary";
      case "lab tech": return "bg-warning/10 text-warning";
      case "patient": return "bg-gray-100 text-gray-600";
      default: return "bg-gray-100 text-gray-600";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Manage system users, patients, and staff roles.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors shadow-sm shadow-primary/30 flex items-center gap-2"
        >
          <span>+</span> New User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex gap-4">
          <input 
            type="text" 
            placeholder="Search users..." 
            className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <select className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
            <option value="">All Roles</option>
            <option value="doctor">Doctor</option>
            <option value="receptionist">Receptionist</option>
            <option value="lab">Lab Tech</option>
            <option value="patient">Patient</option>
          </select>
        </div>

        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Email</th>
              <th className="px-6 py-4">Role</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-600">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${user.status === "Active" ? "bg-success" : "bg-gray-300"}`}></span>
                    <span className="text-sm text-gray-600">{user.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-400 hover:text-primary transition-colors px-2">
                    Edit
                  </button>
                  <button className="text-gray-400 hover:text-danger transition-colors px-2">
                    Disable
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CreateUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
