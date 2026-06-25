"use client";

import { useState, useEffect } from "react";
import ConsentStatusBanner from "@/components/ui/patients/documents/consentStatusBanner";
import ConsentFormViewer from "@/components/ui/patients/documents/consentFormViewer";
import MyDocumentLibrary from "@/components/ui/patients/documents/myDocumentLibrary";

export default function PatientDocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [activeForm, setActiveForm] = useState(null);
  
  // Use a hardcoded patient_id for now if we don't have auth context. 
  // Let's assume we use the first patient or we fetch with credentials if they are implemented.
  // The backend uses get_current_user. Assuming auth is handled by cookies or token in headers.
  
  const fetchConsents = async () => {
    try {
      const token = localStorage.getItem("token"); // Or however auth is managed
      const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };
      
      // Since auth might not be fully wired up for the patient portal in testing,
      // let's just make the fetch. If it fails, we fall back to empty.
      
      const [pendingRes, signedRes] = await Promise.all([
        fetch("http://localhost:8000/patient/consents/pending", { headers }),
        fetch("http://localhost:8000/patient/consents/documents", { headers })
      ]);
      
      let allDocs = [];
      if (pendingRes.ok) {
        const pending = await pendingRes.json();
        const mappedPending = pending.map(c => ({
          id: c.id,
          name: c.title,
          type: "Consent Form",
          size: "N/A",
          date: new Date(c.created_at).toLocaleDateString(),
          signed: false,
          content: c.body_text
        }));
        allDocs = [...allDocs, ...mappedPending];
      }
      
      if (signedRes.ok) {
        const signed = await signedRes.json();
        const mappedSigned = signed.map(c => ({
          id: c.id,
          name: c.title,
          type: "Consent Form",
          size: "PDF",
          date: new Date(c.signed_at).toLocaleDateString(),
          signed: true,
          url: `http://localhost:8000/patient/consents/${c.id}/pdf`,
          content: c.body_text
        }));
        allDocs = [...allDocs, ...mappedSigned];
      }
      
      setDocuments(allDocs);
    } catch (error) {
      console.error("Error fetching consents:", error);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, []);

  const pendingForms = documents.filter((doc) => doc.type === "Consent Form" && !doc.signed);

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
            fetchConsents(); // Refresh list
        } else {
            const data = await res.json();
            alert("Failed to sign: " + data.detail);
        }
    } catch (err) {
        console.error(err);
        alert("Error signing document.");
    }
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
