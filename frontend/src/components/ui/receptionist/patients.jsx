"use client";

import { useState } from "react";

export default function ReceptionistPatients() {
  const [patients, setPatients] = useState([
    { id: "P-101", name: "Sneha Joseph", age: 27, gender: "Female", phone: "+91 91234 56789", email: "sneha@example.com", joined: "2026-03-01", status: "Active" },
    { id: "P-102", name: "Rahul Kumar", age: 32, gender: "Male", phone: "+91 98765 43210", email: "rahul@example.com", joined: "2026-04-12", status: "Active" },
    { id: "P-103", name: "Rohan Varma", age: 28, gender: "Male", phone: "+91 88776 65544", email: "rohan@example.com", joined: "2026-05-18", status: "Active" },
    { id: "P-104", name: "Meera Pillai", age: 62, gender: "Female", phone: "+91 55443 32211", email: "meera@example.com", joined: "2026-06-01", status: "Inactive" },
  ]);

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "Female",
    phone: "",
    email: ""
  });

  const [search, setSearch] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.age) {
      alert("Please fill in Name, Age, and Phone.");
      return;
    }
    const newPatient = {
      id: `P-${Math.floor(100 + Math.random() * 900)}`,
      name: form.name,
      age: parseInt(form.age),
      gender: form.gender,
      phone: form.phone,
      email: form.email || "N/A",
      joined: new Date().toISOString().split("T")[0],
      status: "Active"
    };
    setPatients(prev => [newPatient, ...prev]);
    setForm({
      name: "",
      age: "",
      gender: "Female",
      phone: "",
      email: ""
    });
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.phone.includes(search) || 
    p.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Patient Directory</h1>
        <p className="text-sm text-gray-500 mt-1">Register new patients and view EDR profile summaries.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">Register New Patient</h3>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Priyan John"
              value={form.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Age</label>
              <input
                type="number"
                name="age"
                placeholder="e.g. 29"
                value={form.age}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Gender</label>
              <select
                name="gender"
                value={form.gender}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Phone</label>
            <input
              type="text"
              name="phone"
              placeholder="e.g. +91 99887 76655"
              value={form.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
            <input
              type="email"
              name="email"
              placeholder="e.g. patient@example.com"
              value={form.email}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
          >
            Register Patient
          </button>
        </form>

        {/* Directory List */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center gap-4">
            <h3 className="text-base font-extrabold text-gray-900">Patient Database</h3>
            <input
              type="text"
              placeholder="Search by ID, name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 w-64"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-2">ID</th>
                  <th className="py-3 px-2">Patient Details</th>
                  <th className="py-3 px-2">Contact Info</th>
                  <th className="py-3 px-2">Joined Date</th>
                  <th className="py-3 px-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredPatients.map(p => (
                  <tr key={p.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-2 font-mono text-xs text-gray-400 font-bold">{p.id}</td>
                    <td className="py-3.5 px-2">
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      <div className="text-[10px] text-gray-400">{p.age} years • {p.gender}</div>
                    </td>
                    <td className="py-3.5 px-2 text-xs">
                      <div>{p.phone}</div>
                      <div className="text-gray-400 mt-0.5">{p.email}</div>
                    </td>
                    <td className="py-3.5 px-2 text-xs text-gray-500 font-mono">{p.joined}</td>
                    <td className="py-3.5 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        p.status === "Active" ? "bg-success/10 text-success" : "bg-gray-100 text-gray-400"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
