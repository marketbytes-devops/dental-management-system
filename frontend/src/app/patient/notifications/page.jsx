"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { BookOpen, Sparkles, AlertCircle } from 'lucide-react';
import NotificationList from '@/components/ui/patients/notifications/NotificationList';
import PostCareInstructions from '@/components/ui/patients/notifications/PostCareInstructions';
import FeedbackForm from '@/components/ui/patients/notifications/FeedbackForm';
import { 
  getPatientNotifications, 
  markPatientNotificationAsRead, 
  markAllPatientNotificationsAsRead, 
  deletePatientNotification,
  getPatientProfile,
  getPatientTreatmentPlan
} from '@/services/api';

const postCareInstructions = [
  {
    id: "PC-01",
    treatment: "Root Canal Treatment",
    date: "2026-06-15",
    doctor: "Dr. Anoop Nair",
    guidelines: [
      "Avoid eating or chewing until the numbness wears off completely.",
      "Do not chew or bite on the treated tooth until it is fully restored with a crown.",
      "Take prescribed antibiotics and pain relievers exactly as directed.",
      "Call the clinic immediately if you experience severe swelling or pain after 48 hours."
    ]
  },
  {
    id: "PC-02",
    treatment: "Scaling & Polishing",
    date: "2026-05-12",
    doctor: "Dr. Anoop Nair",
    guidelines: [
      "Avoid highly colored foods or beverages (coffee, tea, red wine, turmeric) for 48 hours to prevent staining.",
      "Expect slight tooth sensitivity to hot and cold for a few days.",
      "Continue regular brushing and flossing, but be gentle around the gums for the first 24 hours."
    ]
  }
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [activePlans, setActivePlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      const data = await getPatientNotifications();
      setNotifications(data);

      const profile = await getPatientProfile();
      if (profile?.token) {
        const plans = await getPatientTreatmentPlan(profile.token);
        const sorted = plans
          .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
          .slice(0, 2);
        setActivePlans(sorted);
      }
    } catch (err) {
      console.error("Failed to load patient notifications or plans:", err);
      setError(err.message || "Could not retrieve notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = 'My Notifications | Patient Portal';
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      if (id === 'all') {
        await markAllPatientNotificationsAsRead();
      } else {
        await markPatientNotificationAsRead(id);
      }
      loadNotifications();
    } catch (err) {
      console.error("Error marking notification read:", err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deletePatientNotification(id);
      loadNotifications();
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">My Notifications</h1>
          <p className="text-sm text-gray-500">Stay updated on your treatments, dental care tips, and reminders.</p>
        </div>
        
        {/* Dental Care Tips Banner Redirect */}
        <Link 
          href="/patient/care-tips"
          className="bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-500 text-white rounded-2xl px-5 py-3 shadow-md transition-all flex items-center gap-3 shrink-0 cursor-pointer text-sm font-semibold hover:-translate-y-0.5"
        >
          <BookOpen className="w-5 h-5" />
          <div className="text-left">
            <span className="block text-xs font-bold uppercase tracking-wider opacity-90">Dental Health</span>
            <span className="block mt-0.5">Care Tips & Post-Care Guidelines</span>
          </div>
          <Sparkles className="w-4 h-4 animate-pulse text-amber-300 ml-2" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Notifications List */}
        <div className="lg:col-span-2 space-y-6">
            
            {loading ? (
              <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center shadow-sm">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-sm text-gray-500">Loading notifications...</p>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-150 text-red-700 rounded-2xl p-4 flex gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            ) : (
              <NotificationList 
                notifications={notifications} 
                onMarkRead={handleMarkRead}
                onDelete={handleDelete}
              />
            )}
        </div>

        {/* Right Column: Post Care & Feedback */}
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-base font-semibold text-gray-900">Recent Post-Care Quick View</h2>
                </div>
                <div className="p-4 bg-gray-50/30">
                     <PostCareInstructions plans={activePlans} />
                </div>
            </div>
            
            <FeedbackForm />
        </div>
      </div>
    </div>
  );
}
