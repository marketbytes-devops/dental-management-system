"use client";

import { useState } from "react";
import ConsentStatusBanner from "@/components/ui/patients/documents/consentStatusBanner";
import ConsentFormViewer from "@/components/ui/patients/documents/consentFormViewer";
import MyDocumentLibrary from "@/components/ui/patients/documents/myDocumentLibrary";
import { myDocuments as initialDocuments } from "@/components/ui/patients/mockData";

export default function PatientDocumentsPage() {
  const [documents, setDocuments] = useState(initialDocuments);
  const [activeForm, setActiveForm] = useState(null);

  const pendingForms = documents.filter((doc) => doc.type === "Consent Form" && !doc.signed);

  const handleSignComplete = (docId, signatureDetails) => {
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, signed: true } : doc))
    );
    setActiveForm(null);
    alert("Consent form signed successfully! It has been stored in your document history.");
  };

  const handleStartSigning = () => {
    if (pendingForms.length > 0) {
      setActiveForm(pendingForms[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Documents & Consent Forms</h1>
      </div>

      {/* Consent Status Indicator */}
      <ConsentStatusBanner
        pendingCount={pendingForms.length}
        onActionClick={handleStartSigning}
      />

      {/* Main Document Library */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <MyDocumentLibrary documents={documents} />
      </div>

      {/* Floating consent signer overlay */}
      {activeForm && (
        <ConsentFormViewer
          doc={activeForm}
          onClose={() => setActiveForm(null)}
          onSignComplete={handleSignComplete}
        />
      )}
    </div>
  );
}
