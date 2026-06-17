"use client";

import { useState } from "react";
import { KeyRound, ArrowRight } from "lucide-react";

export default function PatientOtpEntry({ onVerify, onBack }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");

  const handleChange = (index, value) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== "" && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const enteredOtp = otp.join("");
    
    if (enteredOtp.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    // Mock verification
    if (enteredOtp === "123456" || enteredOtp === "111111") {
      setError("");
      onVerify();
    } else {
      setError("Invalid OTP. Please try again.");
    }
  };

  return (
    <div className="space-y-6 text-center py-4">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
          <KeyRound className="w-8 h-8 text-primary" />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-2xl font-bold text-gray-900">Enter Verification Code</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
          Please enter the 6-digit OTP sent to your phone by the receptionist.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-sm mx-auto space-y-6 pt-4">
        <div className="flex justify-center gap-2 sm:gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              id={`otp-${index}`}
              type="text"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border ${
                error ? "border-danger focus:border-danger focus:ring-danger/20" : "border-gray-200 focus:border-primary focus:ring-primary/20"
              } bg-white focus:outline-none focus:ring-4 transition-all`}
            />
          ))}
        </div>

        {error && <p className="text-sm font-semibold text-danger animate-fade-in">{error}</p>}

        <div className="pt-2 flex flex-col gap-3">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-white font-bold rounded-xl hover:bg-primary/95 transition-all shadow-sm shadow-primary/30"
          >
            Verify & Enter Queue
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onBack}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 py-2"
          >
            Wait, I haven't received it yet
          </button>
        </div>
        
        <div className="text-xs text-gray-400 pt-2">
          (For testing, use <span className="font-bold text-gray-600 bg-gray-100 px-1 rounded">123456</span>)
        </div>
      </form>
    </div>
  );
}
