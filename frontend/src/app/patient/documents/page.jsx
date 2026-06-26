"use client";

import { useState, useEffect } from "react";
import ConsentStatusBanner from "@/components/ui/patients/documents/consentStatusBanner";
import ConsentFormViewer from "@/components/ui/patients/documents/consentFormViewer";
import MyDocumentLibrary from "@/components/ui/patients/documents/myDocumentLibrary";
import { Loader2 } from "lucide-react";
import { getPendingConsents, getSignedConsents, getConsentPdfUrl } from "@/services/api";

export default function PatientDocumentsPage() {
  const [pendingConsents, setPendingConsents] = useState([]);
  const [signedConsents, setSignedConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      // 1. Fetch pending
      const pendingData = await getPendingConsents();
      setPendingConsents(pendingData);

      // 2. Fetch signed
      const signedData = await getSignedConsents();
      setSignedConsents(signedData);
    } catch (err) {
      console.error("Error loading patient documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleSignComplete = (docId) => {
    setActiveForm(null);
    loadDocuments();
    alert("Consent form signed successfully! It has been compiled into a secure PDF document.");
  };

  const handleStartSigning = () => {
    if (pendingConsents.length > 0) {
      setActiveForm(pendingConsents[0]);
    }
  };

  const handleSignDocument = (docId) => {
    const docToSign = pendingConsents.find(c => c.id === docId);
    if (docToSign) {
      setActiveForm(docToSign);
    }
  };

  // Map backend models to expected library schemas
  const mappedDocuments = [
    ...pendingConsents.map(c => ({
      id: c.id,
      name: c.title,
      type: "Consent Form",
      date: new Date(c.created_at).toLocaleDateString("en-IN"),
      url: "#",
      size: "150 KB",
      signed: false,
      content: c.content
    })),
    ...signedConsents.map(c => ({
      id: c.id,
      name: c.title,
      type: "Consent Form",
      date: new Date(c.signed_at || c.created_at).toLocaleDateString("en-IN"),
      url: getConsentPdfUrl(c.id),
      size: "240 KB",
      signed: true,
      content: c.content
    }))
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Loading Document History & Disclosures...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Documents & Consent Forms</h1>
      </div>

      {/* Consent Status Indicator */}
      <ConsentStatusBanner
        pendingCount={pendingConsents.length}
        onActionClick={handleStartSigning}
      />

      {/* Main Document Library */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <MyDocumentLibrary documents={mappedDocuments} onSignDocument={handleSignDocument} />
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
