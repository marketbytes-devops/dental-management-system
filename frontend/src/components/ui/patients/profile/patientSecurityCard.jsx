"use client";

import { useState } from "react";
import { Key, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { changePatientPassword } from "@/services/api";

export default function PatientSecurityCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!currentPassword) {
      setError("Current password is required.");
      return;
    }
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setLoading(true);
    try {
      await changePatientPassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err.message || "Failed to update password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
        <Key className="w-5 h-5 text-primary shrink-0" />
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
          Security &amp; Password
        </h4>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-sm">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold leading-normal border border-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-green-50 text-green-700 rounded-xl text-xs font-semibold flex items-center gap-2 leading-normal border border-green-100">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Password updated successfully.
          </div>
        )}

        {/* Current Password */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-400">
            Current Password
          </label>
          <div className="relative flex items-center">
            <input
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-gray-200 p-2.5 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
            />
            <button
              type="button"
              onClick={() => setShowCurrent(!showCurrent)}
              className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* New + Confirm */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400">
              New Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 p-2.5 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-semibold text-gray-400">
              Confirm New Password
            </label>
            <div className="relative flex items-center">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-200 p-2.5 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-gray-300"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all shadow-sm focus:outline-none disabled:opacity-50 cursor-pointer text-xs"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>
      </form>
    </div>
  );
}
