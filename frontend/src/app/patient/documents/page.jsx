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
import { FileText, Image, FileDigit, Download, Upload, Trash2, Eye, Plus, Sparkles } from "lucide-react";

export default function PatientDocumentsPage() {
  const [documents, setDocuments] = useState([
    { id: "DOC-001", name: "Panoramic Dental X-Ray.jpg", category: "Imaging", date: "2026-05-12", size: "4.2 MB", type: "image" },
    { id: "DOC-002", name: "Root Canal Consent Form.pdf", category: "Consent Form", date: "2026-06-10", size: "128 KB", type: "pdf" },
    { id: "DOC-003", name: "Dental Cleaning Invoice #INV-089.pdf", category: "Billing Invoice", date: "2026-05-12", size: "75 KB", type: "pdf" },
  ]);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newFileName, setNewFileName] = useState("");
  const [newFileCategory, setNewFileCategory] = useState("Imaging");

  // Mock Upload Process
  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!newFileName.trim()) return;

    setUploading(true);
    setUploadProgress(10);

    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const extension = newFileCategory === "Imaging" ? ".jpg" : ".pdf";
            const type = newFileCategory === "Imaging" ? "image" : "pdf";
            const dateStr = new Date().toISOString().split("T")[0];
            
            const newDoc = {
              id: `DOC-00${documents.length + 1}`,
              name: `${newFileName}${newFileName.endsWith(extension) ? "" : extension}`,
              category: newFileCategory,
              date: dateStr,
              size: `${(Math.random() * 2 + 0.1).toFixed(1)} MB`,
              type: type
            };

            setDocuments(prevDocs => [newDoc, ...prevDocs]);
            setUploading(false);
            setUploadProgress(0);
            setNewFileName("");
          }, 300);
          return 100;
        }
        return prev + 30;
      });
    }, 150);
  };

  const handleDownload = (name) => {
    alert(`Downloading ${name}... (Simulated download has started)`);
  };

  const handleDelete = (id) => {
    if (confirm("Are you sure you want to delete this document?")) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Documents & Consent Forms</h1>
        <p className="text-sm text-gray-500 mt-1">
          Review, sign, and view all dental clinic files, X-rays, and treatment authorizations.
        </p>
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
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Documents</h1>
        <p className="text-sm text-gray-500 mt-1">
          Access your digital prescriptions, X-rays, medical records, invoices, and consent sheets.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Document List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-lg font-bold text-gray-900">Your Records ({documents.length})</h3>
          
          <div className="space-y-3">
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex items-center justify-between hover:border-primary/20 transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    doc.type === "image" ? "bg-primary/10 text-primary" : "bg-danger/10 text-danger"
                  }`}>
                    {doc.type === "image" ? <Image className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] bg-gray-100 text-gray-550 font-bold px-2 py-0.5 rounded">
                        {doc.category}
                      </span>
                      <span className="text-xs text-gray-400">{doc.date}</span>
                      <span className="text-xs text-gray-450">•</span>
                      <span className="text-xs text-gray-400">{doc.size}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleDownload(doc.name)}
                    className="p-2 text-gray-400 hover:text-primary transition-colors flex items-center justify-center cursor-pointer hover:bg-primary/5 rounded-lg"
                    title="Download File"
                  >
                    <Download className="w-4.5 h-4.5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 text-gray-400 hover:text-danger transition-colors flex items-center justify-center cursor-pointer hover:bg-danger/5 rounded-lg"
                    title="Delete File"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>
                </div>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="text-center bg-white border border-dashed border-gray-200 rounded-2xl py-12 text-gray-400 font-medium">
                No documents uploaded yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Upload Box */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
              <Upload className="w-5 h-5 text-primary" /> Upload New File
            </h3>

            {uploading ? (
              /* Upload loading state */
              <div className="text-center py-8 space-y-4">
                <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-gray-150" />
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                  <span className="text-xs font-bold text-primary">{uploadProgress}%</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Uploading Document...</p>
                  <p className="text-xs text-gray-400 mt-1">Please keep this tab open</p>
                </div>
              </div>
            ) : (
              /* Upload Form */
              <form onSubmit={handleUploadSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">Document Title</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Tooth Extraction Report" 
                    value={newFileName}
                    onChange={(e) => setNewFileName(e.target.value)}
                    required
                    className="w-full text-sm font-medium border border-gray-250 rounded-lg p-2.5 focus:border-primary focus:outline-none placeholder:text-gray-350"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 block mb-1">File Category</label>
                  <select 
                    value={newFileCategory}
                    onChange={(e) => setNewFileCategory(e.target.value)}
                    className="w-full text-sm font-medium border border-gray-250 rounded-lg p-2.5 bg-white focus:border-primary focus:outline-none cursor-pointer"
                  >
                    <option value="Imaging">Medical Imaging (X-Ray, Scans)</option>
                    <option value="Consent Form">Consent Form</option>
                    <option value="Billing Invoice">Invoices & Bills</option>
                    <option value="Lab Report">Lab Reports & Designs</option>
                  </select>
                </div>

                {/* Drag and Drop Mock Zone */}
                <div className="border-2 border-dashed border-gray-200 hover:border-primary/40 rounded-xl p-6 text-center bg-gray-50/50 cursor-pointer transition-colors relative">
                  <Plus className="w-8 h-8 text-gray-300 mx-auto group-hover:text-primary" />
                  <span className="text-xs font-bold text-gray-500 block mt-2">Select file from device</span>
                  <span className="text-[10px] text-gray-400 block mt-1">Accepts PNG, JPG, PDF up to 10MB</span>
                </div>

                <button 
                  type="submit"
                  disabled={!newFileName.trim()}
                  className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    newFileName.trim() 
                      ? "bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20" 
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Upload className="w-4 h-4" /> Upload Document
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
