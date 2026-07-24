"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Calendar, 
  Droplet, AlertTriangle, FileText, FileImage, 
  CheckCircle, Clock, Stethoscope, Download, Edit, X, Save,
  FileSignature, Printer, Upload, PenTool, Loader2
} from "lucide-react";
import { 
  getAllPatients, 
  getPatientAppointments, 
  adminUpdateUser,
  getAllConsentsForStaff,
  downloadConsentPdf,
  uploadSignedConsentFile
} from "@/services/api";
import BookAppointmentModal from "@/components/features/patients/appointments/bookAppointmentModal";
import ConsentFormViewer from "@/components/features/patients/documents/consentFormViewer";

export default function PatientProfile({ patientId }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [medicalFiles, setMedicalFiles] = useState([]);
  const [consentForms, setConsentForms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);

  // Consent actions modal states
  const [signingConsent, setSigningConsent] = useState(null);
  const [uploadingConsent, setUploadingConsent] = useState(null);
  const [printingConsent, setPrintingConsent] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const fetchPatientConsents = async (token) => {
    try {
      const data = await getAllConsentsForStaff({ patient_token: token });
      setConsentForms(data || []);
    } catch (err) {
      console.error("Failed to fetch consents for patient:", err);
    }
  };

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setIsLoading(true);
        // Fetch all patients and find the one matching the ID
        const allPatients = await getAllPatients();
        const foundPatient = allPatients.find(p => p.id.toString() === patientId);
        if (foundPatient) {
          setPatient(foundPatient);
          
          try {
            const apts = await getPatientAppointments(foundPatient.id);
            setAppointments(apts || []);
          } catch (aptErr) {
            console.error("Failed to fetch appointments:", aptErr);
          }

          // Fetch real live consent forms for this patient
          if (foundPatient.token) {
            await fetchPatientConsents(foundPatient.token);
          }
        } else {
          console.error("Patient not found");
        }
      } catch (error) {
        console.error("Failed to fetch patient:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (patientId) {
      fetchPatientData();
    }
  }, [patientId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium">Loading patient profile...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <AlertTriangle className="w-12 h-12 text-danger opacity-50" />
        <h2 className="text-xl font-bold text-gray-800">Patient Not Found</h2>
        <button 
          onClick={() => router.back()}
          className="px-4 py-2 bg-primary/10 text-primary rounded-xl font-bold hover:bg-primary/20 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "medical", label: "Medical Files" },
    { id: "consents", label: "Consent Forms" },
    { id: "appointments", label: "Appointments" }
  ];

  const handleEditClick = () => {
    setEditFormData({
      name: patient.name || "",
      phone: patient.phone || "",
      email: patient.email || "",
      date_of_birth: patient.date_of_birth || "",
      blood_group: patient.blood_group || "",
      known_allergies: patient.known_allergies || "",
      address_line1: patient.address_line1 || "",
      city: patient.city || "",
      state: patient.state || "",
    });
    setIsEditModalOpen(true);
  };

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await adminUpdateUser(patient.id, editFormData);
      // Update local state directly so it reflects immediately without a full refetch
      setPatient({ ...patient, ...editFormData });
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Failed to update patient profile:", error);
      alert("Failed to update patient profile. Note: Admin API might require specific permissions.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBookAppointment = (newAppt) => {
    // We can either refetch or update locally. Local update is faster.
    setAppointments([newAppt, ...appointments]);
    setIsBookModalOpen(false);
  };

  const renderOverview = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-extrabold text-gray-900 mb-4 uppercase tracking-wider">Contact Information</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Phone Number</p>
                <p className="text-sm font-medium text-gray-900">{patient.phone || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Email Address</p>
                <p className="text-sm font-medium text-gray-900">{patient.email || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Address</p>
                <p className="text-sm font-medium text-gray-900">
                  {patient.address_line1 || "No address provided"}
                  {patient.city && `, ${patient.city}`}
                  {patient.state && `, ${patient.state}`}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
          <h3 className="text-sm font-extrabold text-gray-900 mb-4 uppercase tracking-wider">Medical Summary</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Date of Birth</p>
                <p className="text-sm font-medium text-gray-900">{patient.date_of_birth || "N/A"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Droplet className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-gray-500 font-bold uppercase">Blood Group</p>
                <p className="text-sm font-medium text-gray-900">{patient.blood_group || "Unknown"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-danger mt-0.5" />
              <div>
                <p className="text-[10px] text-danger font-bold uppercase">Known Allergies</p>
                <p className="text-sm font-medium text-gray-900">{patient.known_allergies || "None reported"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMedicalFiles = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-gray-900">Uploaded Records</h3>
        <button className="px-4 py-2 bg-primary/10 text-primary text-xs font-bold rounded-xl hover:bg-primary/20 transition-colors">
          + Upload File
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {medicalFiles.length === 0 ? (
          <div className="col-span-full py-8 text-center text-sm text-gray-400 font-medium">
            No medical files uploaded yet.
          </div>
        ) : (
          medicalFiles.map(file => (
            <div key={file.id} className="group bg-white border border-gray-200 p-4 rounded-2xl hover:shadow-md transition-all duration-300 hover:border-primary/30 flex flex-col justify-between h-full">
              <div>
                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary/5 transition-colors">
                  {file.type === 'image' || file.type === 'scan' ? (
                    <FileImage className="w-6 h-6 text-primary" />
                  ) : (
                    <FileText className="w-6 h-6 text-gray-500" />
                  )}
                </div>
                <h4 className="font-bold text-gray-900 text-sm mb-1 line-clamp-1">{file.name}</h4>
                <p className="text-xs text-gray-500">{file.date} • {file.size}</p>
              </div>
              <button className="mt-4 w-full py-2 bg-gray-50 text-gray-700 text-xs font-bold rounded-lg group-hover:bg-primary group-hover:text-white transition-colors flex items-center justify-center gap-2">
                <Download className="w-3 h-3" /> Download
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadingConsent || !selectedFile) {
      alert("Please select a scanned paper consent file.");
      return;
    }
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      await uploadSignedConsentFile(uploadingConsent.id, formData);
      alert("Signed paper consent copy uploaded successfully.");
      setUploadingConsent(null);
      setSelectedFile(null);
      if (patient?.token) fetchPatientConsents(patient.token);
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.message || "Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

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
      console.error("Download failed:", err);
      alert("Failed to download consent PDF file.");
    }
  };

  const renderConsents = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-white border border-gray-150 rounded-2xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 font-bold text-gray-500 uppercase tracking-wider">
              <th className="py-4 px-5">Document Title</th>
              <th className="py-4 px-5">Doctor</th>
              <th className="py-4 px-5">Date</th>
              <th className="py-4 px-5">Status</th>
              <th className="py-4 px-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 text-gray-700">
            {consentForms.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 text-center text-sm text-gray-400 font-medium">
                  No consent forms found for this patient.
                </td>
              </tr>
            ) : (
              consentForms.map(form => (
                <tr key={form.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-5 font-bold text-gray-900">
                    <div>{form.procedure_name || form.title}</div>
                    {form.custom_details && (
                      <div className="text-[10px] text-gray-400 font-normal line-clamp-1 mt-0.5">{form.custom_details}</div>
                    )}
                  </td>
                  <td className="py-4 px-5 text-gray-600 font-medium">{form.doctor_name || "Doctor"}</td>
                  <td className="py-4 px-5 text-gray-500 whitespace-nowrap">
                    {new Date(form.signed_at || form.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 w-max ${
                      form.status === "SIGNED" ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-amber-50 text-amber-700 border border-amber-100"
                    }`}>
                      {form.status === "SIGNED" ? <CheckCircle className="w-3 h-3 text-emerald-600" /> : <Clock className="w-3 h-3 text-amber-600" />}
                      {form.status}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setPrintingConsent(form)}
                        title="Print Unsigned Form"
                        className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer border border-gray-200"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {form.status === "SIGNED" ? (
                        <button
                          onClick={() => handleDownloadPdf(form.id, form.procedure_name || form.title)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Download PDF
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => setSigningConsent(form)}
                            className="px-2.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <PenTool className="w-3.5 h-3.5" /> In-Person Sign
                          </button>
                          <button
                            onClick={() => setUploadingConsent(form)}
                            className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Upload className="w-3.5 h-3.5" /> Upload Signed
                          </button>
                        </>
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
  );

  const renderAppointments = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="space-y-3">
        {appointments.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-400 font-medium">
            No appointments found.
          </div>
        ) : (
          appointments.map(apt => (
            <div key={apt.id} className="bg-white border border-gray-150 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900">{apt.treatment_type || "Appointment"}</h4>
                  <p className="text-xs text-gray-500 mt-0.5">{apt.doctor_name || "Doctor"} • ID: {apt.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{apt.appointment_date}</p>
                  <p className="text-xs text-gray-500">{apt.appointment_time}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold w-24 text-center ${
                  (apt.status === "Confirmed" || apt.status === "Waiting") ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-500"
                }`}>
                  {apt.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10 max-w-6xl mx-auto">
      {/* Header Navigation */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Patients
      </button>

      {/* Profile Header Card */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
        
        <div className="flex items-center gap-6 relative z-10">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-primary/60 rounded-3xl flex items-center justify-center text-white shadow-lg shrink-0 overflow-hidden relative">
            <User className="w-10 h-10 opacity-50" />
            <div className="absolute inset-0 flex items-center justify-center text-3xl font-black">
              {patient.name.charAt(0)}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-950">{patient.name}</h1>
              <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                patient.is_active ? "bg-success/10 text-success" : "bg-gray-100 text-gray-400"
              }`}>
                {patient.is_active ? "Active" : "Inactive"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 font-medium">
              Token: <span className="font-mono text-gray-800">{patient.token}</span> • {patient.gender}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button 
            onClick={handleEditClick}
            className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-xl text-sm hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <Edit className="w-4 h-4" /> Edit Profile
          </button>
          <button 
            onClick={() => setIsBookModalOpen(true)}
            className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-sm hover:bg-primary/95 shadow-lg shadow-primary/20 transition-all"
          >
            Book Appointment
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id 
                ? "bg-gray-900 text-white shadow-md" 
                : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-150"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content Area */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 md:p-8 shadow-sm min-h-[400px]">
        {activeTab === "overview" && renderOverview()}
        {activeTab === "medical" && renderMedicalFiles()}
        {activeTab === "consents" && renderConsents()}
        {activeTab === "appointments" && renderAppointments()}
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 md:p-8 w-full max-w-2xl shadow-2xl relative my-8 animate-fade-in">
            <button 
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-6 right-6 p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Edit className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-gray-900">Edit Patient Profile</h2>
            </div>
            
            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Full Name</label>
                  <input type="text" name="name" value={editFormData.name} onChange={handleEditChange} required className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-900 font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Phone Number</label>
                  <input type="tel" name="phone" value={editFormData.phone} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-900 font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Email Address</label>
                  <input type="email" name="email" value={editFormData.email} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-900 font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Date of Birth</label>
                  <input type="date" name="date_of_birth" value={editFormData.date_of_birth} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-900 font-medium" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Blood Group</label>
                  <select name="blood_group" value={editFormData.blood_group} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-900 font-medium">
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Known Allergies</label>
                  <input type="text" name="known_allergies" value={editFormData.known_allergies} onChange={handleEditChange} placeholder="e.g., Penicillin, Latex" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-900 font-medium" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Address</label>
                  <input type="text" name="address_line1" value={editFormData.address_line1} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-900 font-medium mb-3" placeholder="Street Address" />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="text" name="city" value={editFormData.city} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-900 font-medium" placeholder="City" />
                    <input type="text" name="state" value={editFormData.state} onChange={handleEditChange} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-gray-900 font-medium" placeholder="State/Province" />
                  </div>
                </div>
              </div>
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2.5 text-gray-700 font-bold hover:bg-gray-100 rounded-xl transition-colors text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-md hover:bg-primary/95 hover:shadow-lg transition-all flex items-center gap-2 text-sm disabled:opacity-70"
                >
                  {isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Book Appointment Modal */}
      {isBookModalOpen && (
        <BookAppointmentModal 
          patientId={patient.id} 
          onClose={() => setIsBookModalOpen(false)} 
          onBook={handleBookAppointment} 
        />
      )}

      {/* In-Person Digital Signing Overlay */}
      {signingConsent && (
        <ConsentFormViewer
          doc={signingConsent}
          onClose={() => setSigningConsent(null)}
          onSignComplete={() => {
            alert("Consent form signed digitally in person!");
            setSigningConsent(null);
            if (patient?.token) fetchPatientConsents(patient.token);
          }}
        />
      )}

      {/* Receptionist Paper Upload Modal */}
      {uploadingConsent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 text-left">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4 border border-gray-150 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-primary" /> Upload Scanned Consent Form
              </h3>
              <button onClick={() => setUploadingConsent(null)} className="text-gray-400 hover:text-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Upload a scanned PDF or image copy of the paper consent form signed physically by the patient.
            </p>

            <form onSubmit={handleUploadSubmit} className="space-y-4 pt-1">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Select File (PDF, PNG, JPG)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setUploadingConsent(null)}
                  className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4 overflow-y-auto text-left">
          <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4 border border-gray-150 animate-fadeIn my-8">
            <div className="flex justify-between items-center pb-3 border-b border-gray-100 print:hidden">
              <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                <Printer className="w-4 h-4 text-primary" /> Print Consent Form Preview
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary/95 flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print Now
                </button>
                <button onClick={() => setPrintingConsent(null)} className="p-1 text-gray-400 hover:text-gray-700">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 font-mono text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
              {printingConsent.content || printingConsent.custom_details || `Procedure Consent Form: ${printingConsent.procedure_name}`}

              {`\n\n----------------------------------------------------\nPATIENT PHYSICAL SIGNATURE:\n\n\n___________________________             _____________\nSignature                               Date\n`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
