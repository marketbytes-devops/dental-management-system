"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FileSignature, 
  Search, 
  Filter, 
  Printer, 
  Upload, 
  CheckCircle2, 
  Clock, 
  Download, 
  Eye, 
  PenTool, 
  RefreshCw, 
  Loader2, 
  FileText,
  User,
  Calendar,
  X
} from "lucide-react";
import { getAllConsentsForStaff, uploadSignedConsentFile, downloadConsentPdf, getDoctors } from "@/services/api";
import ConsentFormViewer from "@/components/features/patients/documents/consentFormViewer";

export default function ReceptionistConsentsPage() {
  const router = useRouter();
  const [consents, setConsents] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [doctorFilter, setDoctorFilter] = useState("");
  
  // Modals state
  const [signingConsent, setSigningConsent] = useState(null);
  const [uploadingConsent, setUploadingConsent] = useState(null);
  const [printingConsent, setPrintingConsent] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Load doctors from DB
  useEffect(() => {
    getDoctors()
      .then(data => {
        if (Array.isArray(data)) {
          setDoctorsList(data);
        }
      })
      .catch(err => console.error("Failed to load doctors list from DB:", err));
  }, []);

  const fetchConsents = async () => {
    setLoading(true);
    try {
      const data = await getAllConsentsForStaff({
        search: searchTerm,
        status_filter: statusFilter,
        doctor_name: doctorFilter
      });
      setConsents(data || []);
    } catch (err) {
      console.error("Error fetching receptionist consents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsents();
  }, [statusFilter, doctorFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchConsents();
  };

  // Receptionist Upload Scanned Paper Signed Copy
  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadingConsent || !selectedFile) {
      alert("Please select a scanned file (PDF or Image) to upload.");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      await uploadSignedConsentFile(uploadingConsent.id, formData);
      alert("Signed paper copy uploaded successfully! Status updated to Signed.");
      setUploadingConsent(null);
      setSelectedFile(null);
      fetchConsents();
    } catch (err) {
      console.error("Failed to upload paper consent:", err);
      alert(err.message || "Failed to upload signed file.");
    } finally {
      setIsUploading(false);
    }
  };

  // In-Person Digital Sign complete callback
  const handleDigitalSignComplete = (docId) => {
    alert("Consent form signed digitally in person! File has been saved.");
    setSigningConsent(null);
    fetchConsents();
  };

  // Download PDF
  const handleDownloadPdf = async (consentId, title) => {
    try {
      const blobData = await downloadConsentPdf(consentId);
      const blob = new Blob([blobData], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${(title || "Consent_Form").replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Download PDF failed:", err);
      alert("Unable to download consent document file.");
    }
  };

  // Real-time doctors list from DB + unique consent doctors
  const dbDoctorNames = doctorsList.map(d => d.name || d.full_name || d.username).filter(Boolean);
  const consentDoctorNames = consents.map(c => c.doctor_name).filter(Boolean);
  const uniqueDoctors = Array.from(new Set([...dbDoctorNames, ...consentDoctorNames]));

  return (
    <div className="space-y-6 pb-12 text-left">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2.5">
            <FileSignature className="w-7 h-7 text-primary" /> Receptionist Consent Forms Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track, print, collect digital signatures, or upload paper consent forms for clinic patients.
          </p>
        </div>

        <button
          onClick={fetchConsents}
          className="self-start md:self-auto px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh List
        </button>
      </div>

      {/* Filter & Search Bar Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search patient name, token ID, procedure name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-slate-800"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">🟡 Pending Signature</option>
              <option value="SIGNED">🟢 Signed</option>
            </select>
          </div>

          {/* Doctor Filter */}
          <div>
            <select
              value={doctorFilter}
              onChange={(e) => setDoctorFilter(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">All Doctors</option>
              {uniqueDoctors.map(doc => (
                <option key={doc} value={doc}>{doc}</option>
              ))}
            </select>
          </div>
        </form>
      </div>

      {/* Consents Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-150 font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Patient Token</th>
                <th className="py-3.5 px-4">Procedure Name</th>
                <th className="py-3.5 px-4">Doctor</th>
                <th className="py-3.5 px-4">Date Issued</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 font-semibold">
                    <Loader2 className="w-6 h-6 text-primary animate-spin mx-auto mb-2" />
                    Syncing Consent Forms...
                  </td>
                </tr>
              ) : consents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 italic">
                    No consent forms found matching your criteria.
                  </td>
                </tr>
              ) : (
                consents.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900">{item.patient_token || `ID #${item.patient_id}`}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800 line-clamp-1">{item.procedure_name || item.title}</div>
                      {item.custom_details && (
                        <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{item.custom_details}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{item.doctor_name || "Doctor"}</td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3.5 px-4">
                      {item.status === "SIGNED" ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Signed ({item.signing_method || "PORTAL"})
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-max animate-pulse">
                          <Clock className="w-3 h-3 text-amber-600" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Print Form */}
                        <button
                          onClick={() => setPrintingConsent(item)}
                          title="Print Unsigned Form"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer border border-slate-200"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {item.status === "PENDING" ? (
                          <>
                            {/* Get Digitally Signed */}
                            <button
                              onClick={() => setSigningConsent(item)}
                              className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                              title="In-Person Digital Signing"
                            >
                              <PenTool className="w-3 h-3" /> Digital Sign
                            </button>

                            {/* Re-upload Paper Copy */}
                            <button
                              onClick={() => setUploadingConsent(item)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                              title="Upload Scanned Paper Form"
                            >
                              <Upload className="w-3 h-3" /> Upload Scanned
                            </button>
                          </>
                        ) : (
                          /* View / Download Signed PDF */
                          <button
                            onClick={() => handleDownloadPdf(item.id, item.procedure_name || item.title)}
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded-lg transition-colors flex items-center gap-1 cursor-pointer text-[11px]"
                          >
                            <Download className="w-3 h-3" /> Download Signed
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* In-Person Digital Signing Overlay */}
      {signingConsent && (
        <ConsentFormViewer
          doc={signingConsent}
          onClose={() => setSigningConsent(null)}
          onSignComplete={handleDigitalSignComplete}
        />
      )}

      {/* Receptionist Paper Upload Modal */}
      {uploadingConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-slate-100 animate-fadeIn text-left">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" /> Upload Scanned Consent Form
              </h3>
              <button onClick={() => setUploadingConsent(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Upload a scanned PDF or image copy of the paper consent form signed physically by the patient.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Select File (PDF, PNG, JPG)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-slate-50 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadingConsent(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !selectedFile}
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  {isUploading ? "Uploading..." : "Save Signed Copy"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Print Preview Modal */}
      {printingConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4 border border-slate-100 animate-fadeIn text-left my-8">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 print:hidden">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-primary" /> Print Consent Form Preview
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Now
                </button>
                <button onClick={() => setPrintingConsent(null)} className="p-1 text-slate-400 hover:text-slate-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Print Content Area */}
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
              {printingConsent.content || printingConsent.custom_details || `Procedure Consent Form: ${printingConsent.procedure_name}`}

              {`\n\n----------------------------------------------------\nPATIENT PHYSICAL SIGNATURE:\n\n\n___________________________             _____________\nSignature                               Date\n`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
