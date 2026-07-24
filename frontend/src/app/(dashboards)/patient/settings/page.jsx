// src/app/patient/settings/page.jsx
"use client";

import React, { useEffect, useState, useContext, createContext } from "react";
import client from "@/services/api";
import { Loader2, Shield, Key, User, Moon, Sun, Monitor } from "lucide-react";

// ---------- Settings Context ----------
const SettingsContext = createContext();
export const useSettings = () => useContext(SettingsContext);

const SettingsProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    theme: "system",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    language: "en",
    twoFAEnabled: false,
    activeSessions: [],
    linkedAccounts: []
  });

  // Fetch settings from backend
  const loadSettings = async () => {
    try {
      const response = await client.get("/patient/settings");
      if (response && response.data) {
        setSettings(prev => ({ ...prev, ...response.data }));
      }
    } catch (e) {
      console.warn("Using fallback local settings", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateSettings = async (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
    try {
      await client.patch("/patient/settings", updates);
    } catch (e) {
      console.warn("Could not sync settings with backend", e);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};

// ---------- Section Components ----------
const SecuritySection = () => {
  const { settings, updateSettings, loading } = useSettings();
  const [tfaLoading, setTfaLoading] = useState(false);

  const toggle2FA = async () => {
    setTfaLoading(true);
    await updateSettings({ twoFAEnabled: !settings.twoFAEnabled });
    setTfaLoading(false);
  };

  return (
    <section className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Shield className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Security</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Two‑Factor Authentication</span>
          <button
            onClick={toggle2FA}
            disabled={loading || tfaLoading}
            className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition"
          >
            {settings.twoFAEnabled ? "Disable" : "Enable"}
          </button>
        </div>
        {/* Placeholder for active sessions list */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Active Sessions</h3>
          {settings.activeSessions.length === 0 ? (
            <p className="text-xs text-gray-500">No active sessions recorded.</p>
          ) : (
            <ul className="space-y-2 text-xs text-gray-600">
              {settings.activeSessions.map((s, i) => (
                <li key={i} className="flex justify-between">
                  <span>{s.device}</span>
                  <span>{s.lastActive}</span>
                </li>
              ))}
            </ul>
          )}
          <button className="mt-2 text-sm text-primary hover:underline" disabled={loading}>
            Log out all other devices
          </button>
        </div>
        {/* Connected accounts */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-medium text-gray-800 mb-2">Connected Accounts</h3>
          <ul className="space-y-2 text-xs text-gray-600">
            {settings.linkedAccounts.map((acc, i) => (
              <li key={i} className="flex items-center justify-between">
                <span>{acc.provider}</span>
                <button className="text-xs text-primary hover:underline" disabled={loading}>
                  {acc.connected ? "Unlink" : "Link"}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};

const PrivacySection = () => {
  const { settings, updateSettings, loading } = useSettings();
  const [deactivating, setDeactivating] = useState(false);

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to temporarily deactivate your account?")) return;
    setDeactivating(true);
    // Placeholder PATCH call
    await updateSettings({ deactivated: true });
    setDeactivating(false);
    alert("Account temporarily deactivated.");
  };

  const handleDelete = async () => {
    if (!confirm("THIS ACTION IS IRREVERSIBLE. Delete your account permanently?")) return;
    // In a real app, you would call a DELETE endpoint.
    alert("Account deletion flow would be executed here.");
  };

  const handleExport = async () => {
    // Placeholder export – would trigger a file download.
    alert("Exporting personal data (GDPR compliance)…");
  };

  return (
    <section className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Key className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Privacy &amp; Account Control</h2>
      </div>
      <div className="space-y-4 text-sm">
        <button
          onClick={handleDeactivate}
          disabled={loading || deactivating}
          className="w-full text-left px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition"
        >
          Temporarily Deactivate Account
        </button>
        <button
          onClick={handleDelete}
          className="w-full text-left px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition"
        >
          Permanently Delete Account
        </button>
        <button
          onClick={handleExport}
          className="w-full text-left px-4 py-2 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition"
        >
          Export Personal Data (GDPR)
        </button>
      </div>
    </section>
  );
};

const PreferencesSection = () => {
  const { settings, updateSettings, loading } = useSettings();

  const themeOptions = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
    { value: "system", label: "System Default" }
  ];

  const handleThemeChange = async (e) => {
    await updateSettings({ theme: e.target.value });
  };

  const handleTimezoneChange = async (e) => {
    await updateSettings({ timezone: e.target.value });
  };

  const handleLanguageChange = async (e) => {
    await updateSettings({ language: e.target.value });
  };

  // Generate a simple timezone list (real app would pull from Intl)
  const timezones = [
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    "America/New_York",
    "Europe/London",
    "Asia/Kolkata"
  ];

  const languages = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "hi", label: "Hindi" },
    { value: "zh", label: "Chinese" }
  ];

  return (
    <section className="bg-white/90 backdrop-blur-sm rounded-2xl border border-gray-100 p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
          <Monitor className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900">Experience Preferences</h2>
      </div>
      <div className="space-y-4">
        {/* Theme toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Visual Theme</span>
          <select
            value={settings.theme}
            onChange={handleThemeChange}
            disabled={loading}
            className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {themeOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        {/* Timezone */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Timezone</span>
          <select
            value={settings.timezone}
            onChange={handleTimezoneChange}
            disabled={loading}
            className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {timezones.map(tz => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </div>
        {/* Language */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">Language</span>
          <select
            value={settings.language}
            onChange={handleLanguageChange}
            disabled={loading}
            className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {languages.map(l => (
              <option key={l.value} value={l.value}>{l.label}</option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
};

// ---------- Main Settings Page ----------
export default function SettingsPage() {
  return (
    <SettingsProvider>
      <InnerSettings />
    </SettingsProvider>
  );
}

function InnerSettings() {
  const { loading } = useSettings();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-8">
      <SecuritySection />
      <PrivacySection />
      <PreferencesSection />
    </div>
  );
}
