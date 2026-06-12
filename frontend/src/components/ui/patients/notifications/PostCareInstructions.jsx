import React from 'react';
import { ClipboardList, AlertCircle, FileText } from 'lucide-react';

export default function PostCareInstructions({ instructions }) {
  if (!instructions || instructions.length === 0) {
     return <p className="text-sm text-gray-500 text-center py-4">No recent post-care instructions.</p>;
  }

  return (
    <div className="space-y-4">
        {instructions.map(instruction => (
            <div key={instruction.id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-50 p-2 rounded-lg border border-green-100">
                            <ClipboardList className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 text-sm">{instruction.treatment}</h3>
                            <p className="text-xs text-gray-500">
                                {new Date(instruction.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {instruction.doctor}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="space-y-2.5">
                    <div className="flex gap-2">
                         <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                         <p className="text-xs font-medium text-gray-700">Guidelines:</p>
                    </div>
                    <ul className="space-y-1.5 pl-6">
                        {instruction.guidelines.map((guideline, index) => (
                            <li key={index} className="text-xs text-gray-600 list-disc">{guideline}</li>
                        ))}
                    </ul>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 flex justify-end">
                    <button className="flex items-center gap-1.5 text-xs text-primary font-medium hover:text-primary/80 transition-colors">
                        <FileText className="w-3.5 h-3.5" /> Download PDF
                    </button>
                </div>
            </div>
        ))}
    </div>
  );
}
