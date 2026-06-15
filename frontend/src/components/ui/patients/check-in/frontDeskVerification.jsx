"use client";

import { UserCheck, AlertTriangle, Clock } from "lucide-react";

export default function FrontDeskVerification({ isEmergency, onOtpSent, onBack }) {
  return (
    <div className="space-y-6 text-center animate-fade-in py-4">
      {/* Emergency Alert Banner */}
      {isEmergency && (
        <div className="flex items-center gap-3 bg-danger/5 border border-danger/20 rounded-2xl p-4 text-left">
          <div className="w-10 h-10 bg-danger/10 rounded-full flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-danger" />
          </div>
          <div>
            <p className="text-sm font-bold text-danger">Emergency Flagged</p>
            <p className="text-xs text-gray-600">
              You will be moved to the front of the queue once verified.
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-center">
        <div className={`w-20 h-20 rounded-full flex items-center justify-center ${isEmergency ? "bg-danger/10" : "bg-primary/10"}`}>
          <UserCheck className={`w-10 h-10 ${isEmergency ? "text-danger" : "text-primary"}`} />
        </div>
      </div>
      
      <div className="space-y-3 max-w-md mx-auto">
        <h3 className="text-2xl font-bold text-gray-900">Approach the Front Desk</h3>
        <p className="text-sm text-gray-500 leading-relaxed">
          Your symptoms have been submitted. Please approach the receptionist and ask them to send the verification OTP to your registered phone number.
        </p>
      </div>

      {/* Steps visual */}
      <div className="max-w-sm mx-auto space-y-3 text-left">
        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
          <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Go to the reception desk</p>
            <p className="text-xs text-gray-500">Inform the receptionist that you've checked in via the app.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
          <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Receptionist sends OTP</p>
            <p className="text-xs text-gray-500">They will click "Send OTP" from their system. You'll receive a code on your phone.</p>
          </div>
        </div>
        <div className="flex items-start gap-3 bg-gray-50 rounded-xl p-3.5 border border-gray-100">
          <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
          <div>
            <p className="text-sm font-semibold text-gray-800">Enter OTP here</p>
            <p className="text-xs text-gray-500">Once you receive the OTP, you'll enter it on the next screen to complete check-in.</p>
          </div>
        </div>
      </div>

      {/* Waiting indicator */}
      <div className="flex items-center justify-center gap-2 text-sm text-gray-400 pt-2">
        <Clock className="w-4 h-4 animate-spin" style={{ animationDuration: "3s" }} />
        <span className="font-medium">Waiting for receptionist to send OTP…</span>
      </div>

      <div className="pt-4 flex flex-col items-center gap-4">
        {/* Mock button for testing */}
        <button
          onClick={onOtpSent}
          className="px-6 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-xl hover:bg-gray-800 transition-colors shadow-sm cursor-pointer"
        >
          [Mock] Simulate OTP Sent
        </button>
        
        <button
          onClick={onBack}
          className="text-sm font-medium text-gray-500 hover:text-gray-700 underline underline-offset-2 cursor-pointer"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
