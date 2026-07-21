"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllPatients } from "@/services/api";
import { Search, Eye } from "lucide-react";

export default function ReceptionistRecords() {
  const router = useRouter();
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const data = await getAllPatients();
      setPatients(data);
    } catch (err) {
      console.error("Error fetching patients for records:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const filteredPatients = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.token && p.token.toLowerCase().includes(search.toLowerCase())) ||
    (p.phone && p.phone.includes(search)) ||
    (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Patient Records</h1>
        <p className="text-sm text-gray-500 mt-1">Review patient details, contact information, and medical dossiers.</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center gap-4">
          <h3 className="text-base font-extrabold text-gray-900">EDR Archival Directory</h3>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search records by ID, name, or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 w-72"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-3">Patient ID</th>
                <th className="py-3 px-3">Full Name</th>
                <th className="py-3 px-3">Phone</th>
                <th className="py-3 px-3">Email</th>
                <th className="py-3 px-3">Address</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-xs text-gray-450 font-bold animate-pulse">
                    Loading Patient Records...
                  </td>
                </tr>
              ) : filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-10 text-center text-xs text-gray-450 font-bold italic">
                    No records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredPatients.map(p => (
                  <tr key={p.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-3 font-mono text-xs text-gray-500 font-bold">{p.token}</td>
                    <td className="py-3.5 px-3 font-semibold text-gray-900">{p.name}</td>
                    <td className="py-3.5 px-3 text-xs">{p.phone || "N/A"}</td>
                    <td className="py-3.5 px-3 text-xs text-gray-500">{p.email || "N/A"}</td>
                    <td className="py-3.5 px-3 text-xs text-gray-500 truncate max-w-[150px]" title={`${p.address_line1 || ""} ${p.city || ""}`.trim()}>
                      {`${p.address_line1 || ""} ${p.city || ""}`.trim() || "N/A"}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => router.push(`/frontdesk/receptionist/patients/${p.id}`)}
                        className="px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg transition-colors inline-flex items-center gap-2 cursor-pointer text-xs font-bold"
                      >
                        <Eye className="w-4 h-4" /> View Profile
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
