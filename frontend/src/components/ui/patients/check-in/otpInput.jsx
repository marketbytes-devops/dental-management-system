"use client";

import { useState, useEffect, useRef } from "react";

export default function OtpInput({ onVerify, onBack, phone = "+91 98765 43210" }) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    setError("");
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value !== "" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, 6);
    if (!/^\d+$/.test(pasteData)) return;

    const newOtp = [...otp];
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i];
    }
    setOtp(newOtp);

    // Focus last input or next empty input
    const focusIndex = Math.min(pasteData.length, 5);
    inputRefs.current[focusIndex].focus();
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setTimer(30);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const fullOtp = otp.join("");
    if (fullOtp.length < 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    // Validation (allow 123456 or 111111)
    if (fullOtp === "123456" || fullOtp === "111111") {
      onVerify();
    } else {
      setError("Invalid security code. Enter 123456 or 111111 to proceed.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-xl font-bold text-gray-900">Security Verification</h3>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          We've sent a 6-digit security code to your registered mobile number <span className="font-semibold text-gray-800">{phone}</span>.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex justify-center gap-2" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => (inputRefs.current[index] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="w-12 h-14 text-center text-lg font-bold border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all"
            />
          ))}
        </div>

        {error && <p className="text-xs text-danger text-center font-medium">{error}</p>}
      </div>

      <div className="text-center space-y-3">
        {timer > 0 ? (
          <p className="text-xs text-gray-500">Resend code in <span className="font-semibold">{timer}s</span></p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-xs text-primary font-semibold hover:underline"
          >
            Resend Code
          </button>
        )}
      </div>

      <div className="flex justify-between gap-4 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2.5 border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors"
        >
          Back
        </button>
        <button
          type="submit"
          className="px-6 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl shadow-sm shadow-primary/30 hover:bg-primary/90 transition-colors"
        >
          Verify & Check In
        </button>
      </div>
    </form>
  );
}
