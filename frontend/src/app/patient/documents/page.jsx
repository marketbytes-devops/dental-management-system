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
  
  // Use a hardcoded patient_id for now if we don't have auth context. 
  // Let's assume we use the first patient or we fetch with credentials if they are implemented.
  // The backend uses get_current_user. Assuming auth is handled by cookies or token in headers.
  
  const getHeaders = () => {
    const token = localStorage.getItem("patient_jwt_token");
    return {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": `Bearer ${token}` } : {})
    };
  };

  const handleSignComplete = async (docId, signatureDetails) => {
    try {
        const token = localStorage.getItem("token");
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
    try {
      // 1. Fetch pending
      const pendingRes = await fetch("http://localhost:8000/patient/consents/pending", {
        headers: getHeaders()
      });
      if (pendingRes.ok) {
        const pendingData = await pendingRes.json();
        setPendingConsents(pendingData);
      }

      // 2. Fetch signed
      const signedRes = await fetch("http://localhost:8000/patient/consents/documents", {
        headers: getHeaders()
      });
      if (signedRes.ok) {
        const signedData = await signedRes.json();
        setSignedConsents(signedData);
      }
    } catch (err) {
      console.error("Error loading patient documents:", err);
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
