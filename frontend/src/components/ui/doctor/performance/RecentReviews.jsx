"use client";

import { useState } from "react";

export default function RecentReviews() {
  const [reviews] = useState([
    { id: 1, patient: "Rahul Kumar", rating: "⭐⭐⭐⭐⭐", date: "Today", comment: "Dr. Anoop Nair was extremely patient. Explanations on the Root Canal Treatment procedure were thorough and the treatment was virtually painless." },
    { id: 2, patient: "Karthika Menon", rating: "⭐⭐⭐⭐⭐", date: "Yesterday", comment: "Excellent service! The composite dental restoration matches my natural tooth color perfectly. Highly recommended clinical work." },
    { id: 3, patient: "Jibin Jose", rating: "⭐⭐⭐⭐⭐", date: "08 Jun 2026", comment: "Very professional dentist. The zirconia crown fitting was completed in just 15 minutes and fits very comfortably." },
    { id: 4, patient: "Sneha Joseph", rating: "⭐⭐⭐⭐", date: "05 Jun 2026", comment: "Prompt appointment and neat scaling. Bleeding from gums has completely stopped. Thank you!" }
  ]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-gray-900">Recent Patient Reviews</h3>
        <span className="text-xs text-primary font-bold hover:underline cursor-pointer">View All</span>
      </div>
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
        {reviews.map((rev) => (
          <div key={rev.id} className="p-3.5 bg-gray-55/50 hover:bg-gray-50 border border-gray-100 rounded-xl transition-colors">
            <div className="flex justify-between items-start mb-1.5">
              <div>
                <span className="text-xs font-bold text-gray-900 block">{rev.patient}</span>
                <span className="text-[9px] text-gray-400 font-bold">{rev.date}</span>
              </div>
              <span className="text-[10px]">{rev.rating}</span>
            </div>
            <p className="text-xs text-gray-650 leading-relaxed font-semibold">{rev.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
