"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { getQueue, updateAppointmentStatus, getDoctors } from "@/services/api";

export default function WaitingQueue() {
  const [activeQueue, setActiveQueue] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const [doctorsList, setDoctorsList] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("All");
  const [selectedPatientDetails, setSelectedPatientDetails] = useState(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const queueData = await getQueue();
      setActiveQueue(queueData);
    } catch (err) {
      console.error("Error fetching queue:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDoctorsList = async () => {
    try {
      const data = await getDoctors();
      setDoctorsList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const handleViewDetails = (q) => {
    setSelectedPatientDetails(q);
  };

  useEffect(() => {
    fetchData();
    fetchDoctorsList();
  }, []);

  const filteredQueue = activeQueue.filter((q) => {
    if (selectedDoctor === "All") return true;
    const qDoc = q.doctor_name ? q.doctor_name.toLowerCase().replace("dr.", "").trim() : "";
    const selDoc = selectedDoctor.toLowerCase().replace("dr.", "").trim();
    return qDoc === selDoc;
  });

  if (isLoading) {
    return <div>Loading queue...</div>;
  }

  return (
    <>
      {/* Checked In Queue & Checkout Panel (12 cols) */}
      <div className="lg:col-span-12 bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-100 pb-3 gap-3">
          <div>
            <h3 className="text-base font-extrabold text-gray-900">
              Arrived Patients Queue
            </h3>
            <p className="text-xs text-gray-500">Manage and route checked-in patients.</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 font-semibold">Filter by Doctor:</span>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-primary text-gray-700 cursor-pointer"
            >
              <option value="All">All Doctors</option>
              {doctorsList.map((doc) => (
                <option key={doc.id} value={doc.name}>
                  {doc.name.startsWith("Dr.") ? doc.name : `Dr. ${doc.name}`}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Patient</th>
                <th className="py-3 px-2">Doctor Route</th>
                <th className="py-3 px-2">Priority</th>
                <th className="py-3 px-2">Est. Wait</th>
                <th className="py-3 px-2">Stage</th>
                <th className="py-3 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
                    className="py-10 text-center text-xs text-gray-400 font-bold"
                  >
                    No checked-in patients in queue matching this filter.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((q) => (
                  <tr
                    key={q.id}
                    className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3.5 px-2">
                      <div className="font-semibold text-gray-900 flex items-center gap-2">
                        {q.patient_name}
                        {q.chief_complaint?.includes("[UNVERIFIED EMERGENCY]") && (
                          <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 rounded" title="Patient claimed emergency during check-in">
                            ⚠️ UNVERIFIED
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400">
                        {q.token} • {q.patient_phone}
                      </div>
                    </td>
                    <td className="py-3.5 px-2 text-xs text-gray-550">
                      {q.doctor_name}
                    </td>
                    <td className="py-3.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${q.priority === "Emergency"
                          ? "bg-danger/10 text-danger animate-pulse border border-danger/20"
                          : q.priority === "Urgent"
                            ? "bg-warning/10 text-warning border border-warning/20"
                            : "bg-success/10 text-success border border-success/20"
                          }`}
                      >
                        {q.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 font-mono text-xs font-semibold text-gray-800">
                      {q.status === "In Chair"
                        ? "N/A"
                        : `${q.wait_time_estimate} mins`}
                    </td>
                    <td className="py-3.5 px-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${q.status === "In Chair"
                          ? "bg-purple-55 text-purple-650 border-purple-100"
                          : "bg-gray-50 text-gray-550 border-gray-150"
                          }`}
                      >
                        {q.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-2 text-right space-x-1.5 flex justify-end">
                      <button
                        onClick={() => handleViewDetails(q)}
                        className="px-2.5 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors font-bold cursor-pointer"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedPatientDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
            <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="text-lg font-extrabold text-gray-900">Patient Details</h3>
              <button
                onClick={() => setSelectedPatientDetails(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Patient Name</p>
                <p className="text-sm font-extrabold text-gray-900">{selectedPatientDetails.patient_name}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Token</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedPatientDetails.token}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Phone</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedPatientDetails.patient_phone || "N/A"}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned Doctor</p>
                  <p className="text-sm font-semibold text-gray-900">{selectedPatientDetails.doctor_name || "Any"}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Priority</p>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mt-1 inline-block ${
                    selectedPatientDetails.priority === "Emergency"
                      ? "bg-danger/10 text-danger border border-danger/20"
                      : selectedPatientDetails.priority === "Urgent"
                      ? "bg-warning/10 text-warning border border-warning/20"
                      : "bg-success/10 text-success border border-success/20"
                  }`}>
                    {selectedPatientDetails.priority || "Routine"}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Chief Complaint</p>
                <p className="text-sm font-medium text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-100 mt-1">
                  {selectedPatientDetails.chief_complaint || "Routine Checkup"}
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setSelectedPatientDetails(null)}
                className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}