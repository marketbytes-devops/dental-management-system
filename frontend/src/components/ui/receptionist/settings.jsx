"use client";

import { useState } from "react";

export default function ReceptionistSettings() {
  const [settings, setSettings] = useState({
    clinicHoursStart: "09:00 AM",
    clinicHoursEnd: "06:00 PM",
    slotInterval: "30 mins",
    autoReminders: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    alert("Receptionist configurations updated successfully.");
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Reception Desk Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Configure appointment slots, automatic reminders, and calendar intervals.</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm max-w-xl">
        <h3 className="text-base font-extrabold text-gray-900 mb-4">Lobby & Calendar Operations</h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Working Hours Start</label>
              <input
                type="text"
                value={settings.clinicHoursStart}
                onChange={(e) => setSettings(prev => ({ ...prev, clinicHoursStart: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Working Hours End</label>
              <input
                type="text"
                value={settings.clinicHoursEnd}
                onChange={(e) => setSettings(prev => ({ ...prev, clinicHoursEnd: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Appointment Slot Interval</label>
            <select
              value={settings.slotInterval}
              onChange={(e) => setSettings(prev => ({ ...prev, slotInterval: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            >
              <option value="15 mins">15 mins</option>
              <option value="30 mins">30 mins</option>
              <option value="45 mins">45 mins</option>
              <option value="60 mins">60 mins</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="autoReminders"
              checked={settings.autoReminders}
              onChange={(e) => setSettings(prev => ({ ...prev, autoReminders: e.target.checked }))}
              className="w-4 h-4 text-primary border-gray-200 rounded focus:ring-primary/20 accent-primary"
            />
            <label htmlFor="autoReminders" className="text-xs font-bold text-gray-755 uppercase select-none cursor-pointer">
              Enable Automatic 24-Hour reminders
            </label>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer mt-2"
          >
            Save Configurations
          </button>
        </form>
      </div>
    </div>
  );
}
