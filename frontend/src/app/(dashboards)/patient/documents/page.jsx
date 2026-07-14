"use client";

import { useState, useEffect } from "react";
import ConsentStatusBanner from "@/components/features/patients/documents/consentStatusBanner";
import ConsentFormViewer from "@/components/features/patients/documents/consentFormViewer";
import MyDocumentLibrary from "@/components/features/patients/documents/myDocumentLibrary";
import { Loader2 } from "lucide-react";
import { getPendingConsents, getSignedConsents, getConsentPdfUrl, downloadConsentPdf } from "@/services/api";

export default function PatientDocumentsPage() {
  const [pendingConsents, setPendingConsents] = useState([]);
  const [signedConsents, setSignedConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState(null);
  const [authError, setAuthError] = useState(false);

  const handleSignComplete = async (docId) => {
    alert("Consent form signed successfully! It has been stored in your document history.");
    setActiveForm(null);
    loadDocuments(); // Refresh list
  };

  const handleDownloadDocument = async (doc) => {
    try {
      const blobData = await downloadConsentPdf(doc.id);
      const blob = new Blob([blobData], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${doc.name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Failed to download PDF:", err);
      alert("Failed to download PDF file.");
    }
  };

  const loadDocuments = async () => {
    setLoading(true);
    setAuthError(false);

    const token = localStorage.getItem("patient_jwt_token");
    if (!token) {
      // No token at all – skip the network requests to avoid TypeError
      setAuthError(true);
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch pending
      const pendingData = await getPendingConsents();
      setPendingConsents(pendingData);

      // 2. Fetch signed
      const signedData = await getSignedConsents();
      setSignedConsents(signedData);
    } catch (err) {
      console.warn("Error loading patient documents:", err);
      // Network error or CORS block on 401 – treat as auth issue
      setAuthError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

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
      url: getConsentPdfUrl(c.id),
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

  if (authError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <p className="text-gray-600">Please log in to view your documents.</p>
        <a
          href="/login"
          className="px-4 py-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          Go to Login
        </a>
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
      <div className="bg-white rounded-3xl border border-gray-150 p-6 shadow-sm">
        <MyDocumentLibrary
          documents={mappedDocuments}
          onSignDocument={handleSignDocument}
          onDownloadDocument={handleDownloadDocument}
        />
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
