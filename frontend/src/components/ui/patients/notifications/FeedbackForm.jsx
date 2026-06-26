"use client";
import React, { useState } from 'react';
import { Star, MessageSquare } from 'lucide-react';

export default function FeedbackForm() {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating === 0) return;
    setSubmitted(true);
    // In a real app, this would send an API request
  };

  if (submitted) {
    return (
        <div className="bg-green-50 rounded-2xl border border-green-100 p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                <Star className="w-6 h-6 text-green-600 fill-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank you for your feedback!</h3>
            <p className="text-sm text-gray-600">Your insights help us improve our care and services.</p>
        </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
          <MessageSquare className="w-5 h-5 text-amber-600" />
        </div>
        <div>
            <h2 className="text-lg font-semibold text-gray-900">Share Your Feedback</h2>
            <p className="text-sm text-gray-500">How was your recent experience with us?</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Overall Rating</label>
            <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
                    >
                        <Star 
                            className={`w-8 h-8 transition-colors ${
                                star <= (hoverRating || rating) 
                                    ? 'text-amber-400 fill-amber-400 drop-shadow-sm' 
                                    : 'text-gray-200'
                            }`} 
                        />
                    </button>
                ))}
            </div>
            {rating === 0 && <p className="text-xs text-amber-600 mt-2">Please select a rating.</p>}
        </div>

        <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                Written Feedback <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
                id="feedback"
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                placeholder="Tell us what you liked or how we can improve..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
            />
        </div>

        <div className="flex justify-end pt-2">
            <button
                type="submit"
                disabled={rating === 0}
                className={`px-5 py-2 rounded-xl font-medium transition-colors text-sm ${
                    rating > 0 
                        ? 'bg-primary text-white hover:bg-primary/90 shadow-sm' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
                Submit Feedback
            </button>
        </div>
      </form>
    </div>
  );
}
