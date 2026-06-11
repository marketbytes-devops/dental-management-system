"use client";

import { useState } from "react";

export default function ReceptionistAppointments() {
  const [appointments, setAppointments] = useState([
    { id: 1, name: "Sneha Joseph", phone: "+91 91234 56789", time: "11:30 AM", date: "2026-06-11", doctor: "Dr. Anoop Nair", type: "Scaling", status: "Confirmed" },
    { id: 2, name: "Rahul Kumar", phone: "+91 98765 43210", time: "12:00 PM", date: "2026-06-11", doctor: "Dr. Anoop Nair", type: "Root Canal", status: "Confirmed" },
    { id: 3, name: "Maria George", phone: "+91 88776 65544", time: "12:45 PM", date: "2026-06-11", doctor: "Dr. Priya Varma", type: "Consultation", status: "Confirmed" },
    { id: 4, name: "Aby Thomas", phone: "+91 77665 54433", time: "02:00 PM", date: "2026-06-12", doctor: "Dr. Priya Varma", type: "Orthodontics", status: "Pending" },
  ]);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    time: "09:00 AM",
    date: new Date().toISOString().split("T")[0],
    doctor: "Dr. Anoop Nair",
    type: "Consultation"
  });

  const doctors = ["Dr. Anoop Nair", "Dr. Priya Varma", "Dr. Sarah Smith"];
  const types = ["Consultation", "Scaling & Polishing", "Root Canal", "Extraction", "Orthodontics", "Dental Filling"];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      alert("Please enter patient name and phone number.");
      return;
    }
    const newApp = {
      id: Date.now(),
      name: form.name,
      phone: form.phone,
      time: form.time,
      date: form.date,
      doctor: form.doctor,
      type: form.type,
      status: "Pending"
    };
    setAppointments(prev => [newApp, ...prev]);
    setForm({
      name: "",
      phone: "",
      time: "09:00 AM",
      date: new Date().toISOString().split("T")[0],
      doctor: "Dr. Anoop Nair",
      type: "Consultation"
    });
  };

  const handleUpdateStatus = (id, newStatus) => {
    setAppointments(prev => prev.map(app => app.id === id ? { ...app, status: newStatus } : app));
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Appointment Booking</h1>
        <p className="text-sm text-gray-500 mt-1">Book new dental appointments and review upcoming schedules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Booking Form (4 cols) */}
        <form onSubmit={handleSubmit} className="lg:col-span-4 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-base font-extrabold text-gray-900">New Booking Form</h3>
          
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Patient Name</label>
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
            <input
              type="text"
              name="phone"
              placeholder="Mobile/Phone"
              value={form.phone}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Date</label>
              <input
                type="date"
                name="date"
                value={form.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Time Slot</label>
              <input
                type="text"
                name="time"
                placeholder="e.g. 11:30 AM"
                value={form.time}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Assigned Doctor</label>
            <select
              name="doctor"
              value={form.doctor}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            >
              {doctors.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Treatment Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            >
              {types.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
          >
            Create Appointment
          </button>
        </form>

        {/* Upcoming List (8 cols) */}
        <div className="lg:col-span-8 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-extrabold text-gray-900 mb-4">Upcoming Appointments</h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <th className="py-3 px-2">Patient</th>
                  <th className="py-3 px-2">Date & Time</th>
                  <th className="py-3 px-2">Doctor</th>
                  <th className="py-3 px-2">Treatment</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {appointments.map(app => (
                  <tr key={app.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-2">
                      <div className="font-semibold text-gray-900">{app.name}</div>
                      <div className="text-[10px] text-gray-400">{app.phone}</div>
                    </td>
                    <td className="py-3.5 px-2 text-xs">
                      <div>{app.date}</div>
                      <div className="text-gray-400 font-mono mt-0.5">{app.time}</div>
                    </td>
                    <td className="py-3.5 px-2 text-gray-500 text-xs">{app.doctor}</td>
                    <td className="py-3.5 px-2 text-gray-650">{app.type}</td>
                    <td className="py-3.5 px-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        app.status === "Confirmed" ? "bg-primary/10 text-primary" :
                        app.status === "Pending" ? "bg-warning/10 text-warning" : "bg-danger/10 text-danger"
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right space-x-1">
                      {app.status === "Pending" && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, "Confirmed")}
                          className="px-2.5 py-1 text-xs bg-success/10 text-success hover:bg-success/20 rounded-lg transition-colors font-bold cursor-pointer"
                        >
                          Confirm
                        </button>
                      )}
                      {app.status !== "Cancelled" && (
                        <button
                          onClick={() => handleUpdateStatus(app.id, "Cancelled")}
                          className="px-2.5 py-1 text-xs bg-danger/10 text-danger hover:bg-danger/20 rounded-lg transition-colors font-bold cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                      {app.status === "Cancelled" && (
                        <span className="text-xs text-gray-400 font-semibold">Cancelled</span>
                      )}
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
