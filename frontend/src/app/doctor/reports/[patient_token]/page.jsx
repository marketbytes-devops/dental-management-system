"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft, Microscope } from "lucide-react";
import { getPatientByToken, getLabOrders } from "@/services/api";

export default function DoctorPatientReportsPage() {
  const params = useParams();
  const router = useRouter();
  const patientToken = params.patient_token;

  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [reports, setReports] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (!patientToken) return;
      setLoading(true);
      try {
        const patData = await getPatientByToken(patientToken);
        setPatient(patData);

        const labData = await getLabOrders();
        const patientLabOrders = labData
          .filter((o) => o.patient_token === patientToken)
          .map((o) => ({
            id: o.id,
            item: o.material ? `${o.prosthetic_type} (${o.material}, Shade ${o.shade})` : `${o.prosthetic_type} (Shade ${o.shade})`,
            status: o.status,
            labName: o.lab_name || "Apex Dental Lab",
            eta: o.due_date || "3 Days",
            created: o.created_at
          }));
        setReports(patientLabOrders);
      } catch (err) {
        console.error("Failed to load patient reports:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [patientToken]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <span className="text-sm font-semibold text-gray-500">Loading Patient Lab Reports...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 text-left">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-150">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/doctor/workspace")}
            className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Patient Reports Library</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Review and manage diagnostic requests, lab fabrications, and test results.
            </p>
          </div>
        </div>
      </div>

      {/* Patient Banner */}
      {patient && (
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400">Patient Name</span>
            <p className="text-sm font-bold text-gray-800 mt-1">{patient.name}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400">Patient ID / Token</span>
            <p className="text-sm font-semibold text-gray-700 mt-1">{patient.token}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400">Gender / Age</span>
            <p className="text-sm font-semibold text-gray-700 mt-1">
              {patient.gender} / {patient.date_of_birth ? `${new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear()} yrs` : "N/A"}
            </p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400">Phone Contact</span>
            <p className="text-sm font-semibold text-gray-700 mt-1">{patient.phone}</p>
          </div>
        </div>
      )}

      {/* Reports Card List */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
          <Microscope className="w-5 h-5 text-primary" /> Active Lab Fabrications & Diagnostic Reports
        </h3>

        <div className="space-y-3 pt-2">
          {reports.length > 0 ? (
            reports.map((order) => (
              <div key={order.id} className="p-4 bg-gray-55/30 border border-gray-100 rounded-2xl flex justify-between items-start gap-4 hover:border-primary/20 transition-all">
                <div>
                  <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                    Order #{order.id}
                  </span>
                  <h4 className="text-sm font-bold text-gray-900 mt-2">{order.item}</h4>
                  <p className="text-xs text-gray-650 mt-1">Lab Partner: <strong className="text-gray-800">{order.labName}</strong></p>
                  <p className="text-xs text-gray-500 mt-1">
                    Created: {order.created ? new Date(order.created).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "N/A"}
                  </p>
                  <p className="text-xs text-gray-455 mt-0.5">ETA / Due: {order.eta}</p>
                </div>
                <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded uppercase border shrink-0 ${
                  order.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                  order.status === "In Progress" ? "bg-sky-50 text-sky-700 border-sky-100 animate-pulse" :
                  "bg-amber-50 text-amber-700 border-amber-100"
                }`}>
                  {order.status}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-gray-400 italic text-xs border border-dashed border-gray-150 rounded-2xl bg-gray-50/20">
              No active or completed lab reports found for this patient.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
