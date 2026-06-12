"use client";

import { useState } from "react";

export default function ReceptionistRecords() {
  const [records, setRecords] = useState([
    { id: "REC-209", name: "Sneha Joseph", age: 27, diagnosis: "Mobility in upper molar", lastVisit: "2026-06-09", files: ["XRay_UpperMolar.jpg", "PreOp_Notes.pdf"] },
    { id: "REC-210", name: "Rahul Kumar", age: 32, diagnosis: "Caries occlusal #16", lastVisit: "2026-06-08", files: ["Panoramic_Scan.jpg"] },
    { id: "REC-211", name: "Rohan Varma", age: 28, diagnosis: "Calculus accumulation", lastVisit: "2026-06-09", files: [] },
  ]);

  const [search, setSearch] = useState("");

  const filteredRecords = records.filter(r => 
    r.name.toLowerCase().includes(search.toLowerCase()) || 
    r.id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Patient Electronic Dental Records</h1>
        <p className="text-sm text-gray-500 mt-1">Review diagnostic histories and archive medical/imaging attachments.</p>
      </div>

      <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex justify-between items-center gap-4">
          <h3 className="text-base font-extrabold text-gray-900">EDR Archival Directory</h3>
          <input
            type="text"
            placeholder="Search records by ID or patient..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-gray-800 w-64"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3 px-2">Record ID</th>
                <th className="py-3 px-2">Patient Details</th>
                <th className="py-3 px-2">Primary Diagnosis</th>
                <th className="py-3 px-2">Last Visit</th>
                <th className="py-3 px-2">Attachments</th>
                <th className="py-3 px-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredRecords.map(r => (
                <tr key={r.id} className="text-sm text-gray-700 hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-2 font-mono text-xs text-gray-400 font-bold">{r.id}</td>
                  <td className="py-3.5 px-2">
                    <div className="font-semibold text-gray-900">{r.name}</div>
                    <div className="text-[10px] text-gray-400">{r.age} years</div>
                  </td>
                  <td className="py-3.5 px-2 text-xs text-gray-650">{r.diagnosis}</td>
                  <td className="py-3.5 px-2 font-mono text-xs text-gray-500">{r.lastVisit}</td>
                  <td className="py-3.5 px-2">
                    {r.files.length === 0 ? (
                      <span className="text-xs text-gray-400">None</span>
                    ) : (
                      <div className="flex flex-col gap-0.5">
                        {r.files.map((f, idx) => (
                          <span key={idx} className="text-[10px] text-primary hover:underline cursor-pointer">📂 {f}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-2 text-right">
                    <button
                      onClick={() => alert(`Opening complete medical dossier for ${r.name}...`)}
                      className="px-2.5 py-1 text-xs bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors font-bold cursor-pointer"
                    >
                      Open Dossier
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
