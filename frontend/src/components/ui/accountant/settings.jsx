"use client";

import { useState, useEffect } from "react";

export default function AccountantSettings() {
  const [settings, setSettings] = useState({
    theme: "light",
    accentColor: "#2563eb",
    compactMode: false,
    fontSize: "medium",
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    const savedCompact = localStorage.getItem("compactMode") === "true";
    const savedFont = localStorage.getItem("fontSize") || "medium";

    setSettings((prev) => ({
      ...prev,
      theme: savedTheme,
      compactMode: savedCompact,
      fontSize: savedFont,
    }));
  }, []);

  const handleSave = (e) => {
    e.preventDefault();

    localStorage.setItem("theme", settings.theme);
    localStorage.setItem("compactMode", settings.compactMode);
    localStorage.setItem("fontSize", settings.fontSize);

    alert("Settings saved successfully.");
  };

  const dark = settings.theme === "dark";

  return (
    <div
      className={`min-h-screen p-6 transition-colors duration-300 ${dark ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"
        }`}
    >
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold">Appearance Settings</h1>
        <p className={dark ? "text-gray-300 mt-1" : "text-gray-500 mt-1"}>
          Customize the look and feel of your dashboard.
        </p>
      </div>

      <div
        className={`max-w-xl rounded-2xl p-6 shadow-sm border transition-colors ${dark
            ? "bg-gray-800 border-gray-700"
            : "bg-white border-gray-200"
          }`}
      >
        <h3 className="text-lg font-bold mb-5">Display Preferences</h3>

        <form onSubmit={handleSave} className="space-y-5">

          {/* Theme */}
          <div>
            <label
              className={`block text-xs font-bold uppercase mb-2 ${dark ? "text-gray-300" : "text-gray-500"
                }`}
            >
              🌙 Theme
            </label>

            <select
              value={settings.theme}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  theme: e.target.value,
                }))
              }
              className={`w-full rounded-lg border px-3 py-2 ${dark
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-200 text-gray-900"
                }`}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          {/* Accent Color */}
          <div>
            <label
              className={`block text-xs font-bold uppercase mb-2 ${dark ? "text-gray-300" : "text-gray-500"
                }`}
            >
              🎨 Accent Color
            </label>

            <input
              type="color"
              value={settings.accentColor}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  accentColor: e.target.value,
                }))
              }
              className="h-10 w-16 rounded border cursor-pointer"
            />
          </div>

          {/* Compact Mode */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={settings.compactMode}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  compactMode: e.target.checked,
                }))
              }
              className="h-4 w-4 accent-blue-600"
            />

            <label className={dark ? "text-white" : "text-gray-700"}>
              🖥️ Enable Compact Mode
            </label>
          </div>

          {/* Font Size */}
          <div>
            <label
              className={`block text-xs font-bold uppercase mb-2 ${dark ? "text-gray-300" : "text-gray-500"
                }`}
            >
              🔤 Font Size
            </label>

            <select
              value={settings.fontSize}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  fontSize: e.target.value,
                }))
              }
              className={`w-full rounded-lg border px-3 py-2 ${dark
                  ? "bg-gray-700 border-gray-600 text-white"
                  : "bg-white border-gray-200 text-gray-900"
                }`}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-5 py-2.5 font-bold text-white hover:bg-blue-700"
          >
            Save Settings
          </button>
        </form>
      </div>
    </div>
  );
}