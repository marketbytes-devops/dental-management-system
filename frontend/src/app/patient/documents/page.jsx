"use client";

import { useState, useEffect } from "react";
import ConsentStatusBanner from "@/components/ui/patients/documents/consentStatusBanner";
import ConsentFormViewer from "@/components/ui/patients/documents/consentFormViewer";
import MyDocumentLibrary from "@/components/ui/patients/documents/myDocumentLibrary";
import { Loader2 } from "lucide-react";

export default function PatientDocumentsPage() {
  const [pendingConsents, setPendingConsents] = useState([]);
  const [signedConsents, setSignedConsents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState(null);
  const [authError, setAuthError] = useState(false);

  const getHeaders = () => {
    const token = localStorage.getItem("patient_jwt_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  const handleSignComplete = async (docId, signatureDetails) => {
    try {
        const token = localStorage.getItem("patient_jwt_token");
        if (!token) {
          alert("Your session has expired. Please log in again.");
          window.location.href = "/login";
          return;
        }
        const headers = {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        };
        
        const res = await fetch(`http://localhost:8000/patient/consents/${docId}/sign`, {
            method: "POST",
            headers,
            body: JSON.stringify({
                signature_data: signatureDetails.signatureImage,
                signing_method: "PORTAL"
            })
        });
        
        if (res.ok) {
            alert("Consent form signed successfully! It has been stored in your document history.");
            setActiveForm(null);
            loadDocuments(); // Refresh list
        } else {
            const data = await res.json();
            alert("Failed to sign: " + data.detail);
        }
    } catch (err) {
        console.error(err);
        alert("Error signing document.");
    }
  }

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
      const headers = getHeaders();

      // 1. Fetch pending
      const pendingRes = await fetch("http://localhost:8000/patient/consents/pending", {
        headers
      });
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingConsents(pendingData);
      } else if (pendingRes.status === 401) {
        setAuthError(true);
        setLoading(false);
        return;
      }

      // 2. Fetch signed
      const signedRes = await fetch("http://localhost:8000/patient/consents/documents", {
        headers
      });
      if (signedRes.ok) {
        const signedData = await signedRes.json();
        setSignedConsents(signedData);
      } else if (signedRes.status === 401) {
        setAuthError(true);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("Error loading patient documents:", err);
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
      url: `http://localhost:8000/patient/consents/${c.id}/pdf`,
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
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <MyDocumentLibrary documents={mappedDocuments} />
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
