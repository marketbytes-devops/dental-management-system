"use client";

import { useState } from "react";

export default function RecentReviews() {
  const [reviews] = useState([]);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-bold text-gray-900">Recent Patient Reviews</h3>
        <span className="text-xs text-primary font-bold hover:underline cursor-pointer">View All</span>
      </div>
      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
        {reviews.length > 0 ? (
          reviews.map((rev) => (
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
          ))
        ) : (
          <div className="text-center py-12 text-gray-450 font-semibold text-xs border border-dashed border-gray-150 rounded-xl">
            No patient reviews received yet.
          </div>
        )}
      </div>
    </div>
  );
}
