"use client";

import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, User } from 'lucide-react';
import { getAvailableDoctors, submitDoctorFeedback } from '@/services/api';

export default function FeedbackForm() {
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchDoctorsList() {
      try {
        const data = await getAvailableDoctors();
        setDoctors(data);
        if (data.length > 0) {
          setSelectedDoctor(data[0].name);
        }
      } catch (err) {
        console.error("Failed to fetch doctors list for feedback:", err);
      }
    }
    fetchDoctorsList();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || !selectedDoctor) return;
    
    setLoading(true);
    setError("");
    
    try {
      await submitDoctorFeedback({
        doctor_name: selectedDoctor,
        rating: rating,
        feedback_text: feedback
      });
      setSubmitted(true);
    } catch (err) {
      console.error("Failed to submit feedback:", err);
      setError(err.message || "Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
        <div className="bg-green-50 rounded-2xl border border-green-100 p-8 text-center shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-200">
                <Star className="w-6 h-6 text-green-600 fill-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Thank you for your feedback!</h3>
            <p className="text-sm text-gray-600">Your feedback has been registered and escalated to our clinic administration for quality control.</p>
            <button 
              onClick={() => {
                setSubmitted(false);
                setRating(0);
                setFeedback("");
              }}
              className="mt-4 text-xs font-bold text-primary hover:underline"
            >
              Submit another review
            </button>
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
            <h2 className="text-lg font-semibold text-gray-900">Rate Your Dentist</h2>
            <p className="text-sm text-gray-500">Provide performance feedback on your care.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <p className="text-xs font-semibold text-danger bg-danger/5 border border-danger/10 p-2.5 rounded-xl">{error}</p>
        )}

        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1.5">
              <User className="w-4 h-4 text-gray-400" /> Select Attending Doctor
            </label>
            <select
              value={selectedDoctor}
              onChange={(e) => setSelectedDoctor(e.target.value)}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white font-medium"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.name}>
                  {doc.name} ({doc.specialty})
                </option>
              ))}
              {doctors.length === 0 && (
                <option value="">No doctors available</option>
              )}
            </select>
        </div>

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
                        className="focus:outline-none transition-transform hover:scale-110 active:scale-95 cursor-pointer"
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
            {rating === 0 && <p className="text-xs text-amber-600 mt-2 font-medium">Please select a rating.</p>}
        </div>

        <div>
            <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                Written Feedback <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
                id="feedback"
                rows={3}
                className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none font-medium"
                placeholder="Tell us about the doctor's communication, care quality, or areas for improvement..."
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
            />
        </div>

        <div className="flex justify-end pt-2">
            <button
                type="submit"
                disabled={rating === 0 || loading || !selectedDoctor}
                className={`px-5 py-2.5 rounded-xl font-bold transition-all text-sm shadow-sm ${
                    rating > 0 && !loading && selectedDoctor
                        ? 'bg-primary text-white hover:bg-primary/95 cursor-pointer hover:-translate-y-0.5' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
            >
                {loading ? "Submitting..." : "Submit Feedback"}
            </button>
        </div>
      </form>
    </div>
  );
}
