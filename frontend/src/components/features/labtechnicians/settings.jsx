"use client";

import { useState } from "react";

export default function LabSettings() {
  const [activeTab, setActiveTab] = useState("Profile"); // Profile, Security, Notifications, Company Settings, Integrations
  const [toast, setToast] = useState({ show: false, message: "" });

  const triggerToast = (message) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  };

  const handleSave = (e) => {
    e.preventDefault();
    triggerToast("Settings saved successfully!");
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border border-gray-100 bg-white animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="w-3 h-3 rounded-full bg-success animate-pulse"></span>
          <span className="text-sm font-semibold text-gray-800">{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Lab Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Configure profile details, security access tokens, order notifications, and milling system integrations.</p>
        </div>

        <button 
          onClick={handleSave}
          className="px-5 py-2.5 bg-primary text-white font-extrabold rounded-xl text-xs hover:bg-primary/95 transition-all cursor-pointer shadow-sm shadow-primary/30"
        >
          ✓ Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 w-full overflow-x-auto max-w-2xl select-none">
        {["Profile", "Security", "Notifications", "Company Settings", "Integrations"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer text-center ${
              activeTab === tab ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Settings Panel */}
      <div className="bg-white border border-gray-150 rounded-2xl p-6 shadow-sm">
        
        {/* 1. Profile Tab */}
        {activeTab === "Profile" && (
          <form onSubmit={handleSave} className="space-y-6 max-w-xl">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/15 text-primary text-2xl font-black flex items-center justify-center">
                AJ
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-800">Alen Joseph</h4>
                <p className="text-xs text-gray-400">Senior CAD Designer</p>
                <button type="button" className="text-[10px] text-primary font-bold mt-1.5 cursor-pointer hover:underline">
                  Change Photo
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">First Name</label>
                <input 
                  type="text" 
                  defaultValue="Alen"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
                <input 
                  type="text" 
                  defaultValue="Joseph"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
              <input 
                type="email" 
                defaultValue="alen.joseph@smilecare.com"
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800"
              />
            </div>
          </form>
        )}

        {/* 2. Security Tab */}
        {activeTab === "Security" && (
          <form onSubmit={handleSave} className="space-y-6 max-w-xl">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Current Password</label>
              <input 
                type="password" 
                placeholder="••••••••••••"
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">New Password</label>
              <input 
                type="password" 
                placeholder="Min 8 characters"
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Confirm Password</label>
              <input 
                type="password" 
                placeholder="Match password"
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800"
              />
            </div>
          </form>
        )}

        {/* 3. Notifications Tab */}
        {activeTab === "Notifications" && (
          <div className="space-y-4 max-w-lg">
            <h3 className="text-sm font-extrabold text-gray-850">Alert Preferences</h3>
            
            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-primary accent-primary w-4 h-4" />
                <div>
                  <h4 className="text-xs font-bold text-gray-800">New Orders Incoming</h4>
                  <p className="text-[10px] text-gray-400">Receive alert when a dentist uploads a new STL prescription case.</p>
                </div>
              </label>

              <label className="flex items-start gap-3.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-primary accent-primary w-4 h-4" />
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Quality Review Flags</h4>
                  <p className="text-[10px] text-gray-400">Receive alert if inspector rejects or submits remake instructions.</p>
                </div>
              </label>

              <label className="flex items-start gap-3.5 cursor-pointer">
                <input type="checkbox" defaultChecked className="mt-0.5 rounded text-primary accent-primary w-4 h-4" />
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Delivery Dispatched Updates</h4>
                  <p className="text-[10px] text-gray-400">Alert once express courier picks up completed dentures or crowns.</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* 4. Company Settings Tab */}
        {activeTab === "Company Settings" && (
          <form onSubmit={handleSave} className="space-y-6 max-w-xl">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Dental Laboratory Name</label>
              <input 
                type="text" 
                defaultValue="SmileCare Central Dental Lab"
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Registration Number</label>
                <input 
                  type="text" 
                  defaultValue="LAB-IND-984"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">VAT / GST Identification</label>
                <input 
                  type="text" 
                  defaultValue="29AAAAA0000A1Z5"
                  className="px-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-800"
                />
              </div>
            </div>
          </form>
        )}

        {/* 5. Integrations Tab */}
        {activeTab === "Integrations" && (
          <div className="space-y-4 max-w-xl">
            <h3 className="text-sm font-extrabold text-gray-850">Connected Equipment APIs</h3>
            
            <div className="space-y-3 pt-2">
              <div className="p-3 border border-gray-150 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-800">3Shape Dental Manager API</h4>
                  <p className="text-[10px] text-gray-400">Auto-pull and sync CAD scans into design viewports.</p>
                </div>
                <span className="text-xs font-bold text-success bg-success/15 px-2.5 py-1 rounded-lg">Connected</span>
              </div>

              <div className="p-3 border border-gray-150 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-gray-800">Roland DG Milling Bridge</h4>
                  <p className="text-[10px] text-gray-400">Push STL coordinates to milling units instantly.</p>
                </div>
                <button type="button" className="text-xs font-extrabold text-primary bg-primary/5 border border-primary/20 px-3 py-1 rounded-lg hover:bg-primary hover:text-white transition-colors cursor-pointer">
                  Connect
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
