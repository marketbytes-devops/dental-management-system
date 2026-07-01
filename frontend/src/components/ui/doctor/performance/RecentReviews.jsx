"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare } from "lucide-react";
import { getDoctorFeedbackStats } from "@/services/api";

export default function RecentReviews() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ average_rating: 0, total_reviews: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReviews() {
      if (typeof window !== "undefined") {
        try {
          const userStr = localStorage.getItem("staff_user");
          if (userStr) {
            const user = JSON.parse(userStr);
            const doctorName = user.name || "Dr. Anoop Nair";
            const data = await getDoctorFeedbackStats(doctorName);
            setReviews(data.feedbacks || []);
            setStats({
              average_rating: data.average_rating || 0,
              total_reviews: data.total_reviews || 0
            });
          }
        } catch (err) {
          console.error("Failed to load doctor reviews:", err);
        } finally {
          setLoading(false);
        }
      }
    }
    loadReviews();
  }, []);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-full flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-base font-bold text-gray-900">Recent Patient Reviews</h3>
            {stats.total_reviews > 0 && (
              <p className="text-xs font-semibold text-gray-500 mt-0.5 flex items-center gap-1">
                Avg Rating: <span className="text-amber-500 font-bold flex items-center">{stats.average_rating} <Star className="w-3 h-3 fill-amber-500 inline text-amber-500 ml-0.5" /></span> ({stats.total_reviews} reviews)
              </p>
            )}
          </div>
        </div>

        <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
          {loading ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-2"></div>
              Loading reviews...
            </div>
          ) : reviews.length > 0 ? (
            reviews.map((rev) => (
              <div key={rev.id} className="p-3.5 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-xl transition-all">
                <div className="flex justify-between items-start mb-1.5">
                  <div>
                    <span className="text-xs font-bold text-gray-800 block">{rev.patient_name}</span>
                    <span className="text-[9px] text-gray-400 font-semibold">
                      {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : "Just now"}
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
