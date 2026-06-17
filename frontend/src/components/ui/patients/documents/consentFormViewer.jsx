import { useState } from "react";
import SignatureCanvas from "./signatureCanvas";
import { PenTool, Keyboard } from "lucide-react";

export default function ConsentFormViewer({ doc, onSignComplete, onClose }) {
  const [typedName, setTypedName] = useState("");
  const [signatureMode, setSignatureMode] = useState("draw"); // "draw" or "type"

  const handleSignSubmit = (signatureData) => {
    onSignComplete(doc.id, {
      method: signatureMode,
      typedName: signatureMode === "type" ? typedName : null,
      signatureImage: signatureMode === "draw" ? signatureData : null,
      date: new Date().toLocaleDateString("en-IN"),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl border border-gray-150">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{doc.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Please read, review, and sign below</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors text-xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 text-sm text-gray-600 leading-relaxed">
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-4">
            <h4 className="font-bold text-gray-800 uppercase tracking-wider text-xs">Patient & Procedure Information</h4>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-gray-400 block font-medium">Patient Name</span>
                <span className="text-gray-800 font-semibold">Rahul Kumar</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Patient ID</span>
                <span className="text-gray-800 font-semibold">PT-10042</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Treatment / Procedure</span>
                <span className="text-gray-800 font-semibold">Root Canal Treatment (Endodontic therapy)</span>
              </div>
              <div>
                <span className="text-gray-400 block font-medium">Clinician</span>
                <span className="text-gray-800 font-semibold">Dr. Anoop Nair</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-gray-800">1. Nature of the Procedure</h4>
            <p>
              I hereby authorize Dr. Anoop Nair to perform a Root Canal Treatment on the designated tooth/teeth. This procedure involves removing infected or damaged pulp tissue from inside the root canals of the tooth, cleaning and shaping the canals, and sealing them with a biocompatible filling material.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-gray-800">2. Risks and Complications</h4>
            <p>
              While endodontic therapy has a very high success rate, I understand that risks include, but are not limited to: post-operative pain or swelling, instrument fracture inside the root canal, root perforation, or failure of the treatment requiring extraction or root-end surgery.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-gray-800">3. Acknowledgment & Consent</h4>
            <p>
              I understand the treatment details, alternatives, risks, and estimated costs. I have had the opportunity to ask questions, and they have been answered to my satisfaction. I understand that dentistry is not an exact science and that no guarantees have been made regarding the outcome.
            </p>
          </div>

          {/* Signature Selection Tab */}
          <div className="border-t border-gray-100 pt-6 space-y-4">
            <h4 className="font-bold text-gray-800">Choose Signature Method</h4>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSignatureMode("draw")}
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
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
                className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-all ${
                  signatureMode === "type"
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                <Keyboard className="w-4 h-4" /> Type Name
              </button>
            </div>

            {signatureMode === "type" ? (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-gray-700 block">Type your Full Name to sign</label>
                <input
                  type="text"
                  value={typedName}
                  onChange={(e) => setTypedName(e.target.value)}
                  placeholder="Rahul Kumar"
                  className="w-full p-3 border border-gray-200 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none transition-all text-gray-850 font-medium"
                />
                <div className="text-xs text-gray-400 italic">
                  By typing your name, you agree that this constitutes your legal digital signature.
                </div>
                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2 border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSignSubmit(null)}
                    disabled={!typedName.trim()}
                    className="px-5 py-2 bg-primary/5 border border-primary/20 text-primary text-xs font-semibold rounded-lg hover:bg-primary hover:text-white hover:border-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
