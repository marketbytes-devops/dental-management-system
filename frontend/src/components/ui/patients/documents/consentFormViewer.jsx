import { useState } from "react";
import SignatureCanvas from "./signatureCanvas";
import { PenTool, Keyboard, Loader2 } from "lucide-react";

export default function ConsentFormViewer({ doc, onSignComplete, onClose }) {
  const [typedName, setTypedName] = useState("");
  const [signatureMode, setSignatureMode] = useState("draw"); // "draw" or "type"
  const [submitting, setSubmitting] = useState(false);

  const handleSignSubmit = async (signatureData) => {
    setSubmitting(true);
    const token = localStorage.getItem("patient_jwt_token");
    const sigPayload = {
      signature_data: signatureMode === "type" ? typedName : signatureData,
      method: signatureMode
    };

    try {
      const response = await fetch(`http://localhost:8000/patient/consents/${doc.id}/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(sigPayload)
      });

      if (response.ok) {
        onSignComplete(doc.id);
      } else {
        const err = await response.json();
        alert(err.detail || "Failed to submit signature.");
      }
    } catch (err) {
      console.error("Signature submission error:", err);
      alert("Connection error during signature submission.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl border border-gray-150">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{doc.title || doc.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Please read, review, and sign below</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-gray-600 leading-relaxed">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
            <h4 className="font-bold text-gray-800 uppercase tracking-wider text-xs">Document Information</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">Document ID</span>
                <span className="text-gray-800 font-semibold">{doc.id || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Title</span>
                <span className="text-gray-800 font-semibold">{doc.name || "Consent Form"}</span>
              </div>
            </div>
          </div>

          {doc.content ? (
            <div className="space-y-3 whitespace-pre-wrap">
              <p>{doc.content}</p>
            </div>
          ) : (
            <div className="space-y-3 text-gray-500 italic">
              <p>Consent document content is not available.</p>
            </div>
          )}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-gray-600 leading-relaxed text-left">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
            <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[10px]">Form details</h4>
            <p className="text-xs font-semibold text-gray-700 leading-normal">
              This document is legally binding. Once signed, a copy will be stored in your digital history.
            </p>
          </div>

          <div className="space-y-3 font-medium text-gray-705 whitespace-pre-wrap leading-relaxed">
            {doc.content}
          </div>

          {/* Signature Selection Tab */}
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <h4 className="font-bold text-gray-800">Choose Signature Method</h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSignatureMode("draw")}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  signatureMode === "draw"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <PenTool className="w-4 h-4" /> Draw Signature
              </button>
              <button
                type="button"
                onClick={() => setSignatureMode("type")}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer ${
                  signatureMode === "type"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Keyboard className="w-4 h-4" /> Type Name
              </button>
            </div>

            {submitting ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-gray-500">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <span>Applying signature and generating PDF file...</span>
              </div>
            ) : signatureMode === "type" ? (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-700 block">Type your Full Name to sign</label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Your Full Name"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all text-gray-850 font-medium"
                />
                <div className="text-xs text-gray-400 italic">
                  By typing your name, you agree that this constitutes your legal digital signature.
                </div>
                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSignSubmit(null)}
                    disabled={!typedName.trim()}
                    className="px-5 py-2 bg-primary text-white border border-primary/20 text-xs font-semibold rounded-lg hover:bg-primary/95 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Apply Signature
                  </button>
                </div>
              </div>
            ) : (
              <SignatureCanvas onSave={handleSignSubmit} onCancel={onClose} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
