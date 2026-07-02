"use client";

import { useState } from "react";

export default function ClinicalNotes({ onSubmitDiagNote }) {
  const [diagNoteInput, setDiagNoteInput] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!diagNoteInput.trim()) return;
    onSubmitDiagNote(diagNoteInput.trim());
    setDiagNoteInput("");
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
      <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">Add Diagnosis Clinical Note</h4>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          rows={3}
          value={diagNoteInput}
          onChange={(e) => setDiagNoteInput(e.target.value)}
          placeholder="Write diagnostic observations or active findings..."
          className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          required
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-primary/95 transition-colors cursor-pointer"
          >
            Append Note
          </button>
        </div>
      </form>
    </div>
  );
}
