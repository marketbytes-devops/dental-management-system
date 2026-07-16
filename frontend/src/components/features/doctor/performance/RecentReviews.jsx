"use client";

import { Star } from "lucide-react";

export default function RecentReviews({ reviews }) {
  const totalReviews = reviews?.length || 0;
  const averageRating = totalReviews > 0 ? (reviews.reduce((acc, rev) => acc + rev.rating, 0) / totalReviews).toFixed(1) : 0;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Recent Patient Reviews</h3>
            {totalReviews > 0 && (
              <p className="text-xs font-semibold text-gray-500 mt-0.5 flex items-center gap-1">
                Avg Rating: <span className="text-amber-500 font-bold flex items-center">{averageRating} <Star className="w-3 h-3 fill-amber-500 inline text-amber-500 ml-0.5" /></span> ({totalReviews} reviews)
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
          {totalReviews > 0 ? (
            reviews.map((rev) => (
              <div key={rev.id} className="p-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl transition-all">
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <span className="text-[9px] text-gray-400 font-semibold">
                      {rev.date}
                    </span>
                  </div>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-3 h-3 ${star <= rev.rating ? "text-amber-400 fill-amber-400" : "text-gray-200"}`} 
                      />
                    ))}
                  </div>
                </div>
                {rev.feedback_text && (
                  <p className="text-xs text-gray-600 leading-relaxed font-medium mt-1">
                    {rev.feedback_text}
                  </p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 text-gray-400 font-medium text-xs border border-dashed border-gray-200 rounded-xl">
              No patient reviews received yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
