"use client";

import { useState } from "react";

export default function AccountantSettings() {
  const [settings, setSettings] = useState({
    taxPercent: "18",
    currency: "INR (₹)",
    invoicePrefix: "INV-",
    stripeActive: true
  });

  const handleSave = (e) => {
    e.preventDefault();
    alert("Billing configurations updated successfully.");
  };

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Billing Configurations</h1>
        <p className="text-sm text-gray-500 mt-1">Configure tax brackets, invoice numbering format, and payment gateway rules.</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm max-w-xl">
        <h3 className="text-base font-extrabold text-gray-900 mb-4">Invoice & Gateways Settings</h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">GST Tax Rate (%)</label>
              <input
                type="number"
                value={settings.taxPercent}
                onChange={(e) => setSettings(prev => ({ ...prev, taxPercent: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase">Invoice Prefix Code</label>
              <input
                type="text"
                value={settings.invoicePrefix}
                onChange={(e) => setSettings(prev => ({ ...prev, invoicePrefix: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-500 uppercase">Currency Standard</label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings(prev => ({ ...prev, currency: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 bg-white rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800"
            >
              <option value="INR (₹)">INR (₹) - Indian Rupee</option>
              <option value="USD ($)">USD ($) - United States Dollar</option>
              <option value="EUR (€)">EUR (€) - Euro</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="stripeActive"
              checked={settings.stripeActive}
              onChange={(e) => setSettings(prev => ({ ...prev, stripeActive: e.target.checked }))}
              className="w-4 h-4 text-primary border-gray-200 rounded focus:ring-primary/20 accent-primary"
            />
            <label htmlFor="stripeActive" className="text-xs font-bold text-gray-755 uppercase select-none cursor-pointer">
              Enable Razorpay / Stripe Card Gateway Settlements
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
