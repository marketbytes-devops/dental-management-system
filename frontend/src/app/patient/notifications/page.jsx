import React from 'react';
import NotificationList from '@/components/ui/patients/notifications/NotificationList';
import PostCareInstructions from '@/components/ui/patients/notifications/PostCareInstructions';
import RecallReminderCard from '@/components/ui/patients/notifications/RecallReminderCard';
import FeedbackForm from '@/components/ui/patients/notifications/FeedbackForm';
const myNotifications = [];
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

export const metadata = {
  title: 'My Notifications | Patient Portal',
  description: 'View your notifications, reminders, and post-care instructions.',
};

export default function NotificationsPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">My Notifications</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Notifications List */}
        <div className="lg:col-span-2 space-y-6">
            <RecallReminderCard />
            <NotificationList notifications={myNotifications} />
        </div>

        {/* Right Column: Post Care & Feedback */}
        <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                    <h2 className="text-base font-semibold text-gray-900">Recent Post-Care</h2>
                </div>
                <div className="p-4 bg-gray-50/30">
                     <PostCareInstructions instructions={postCareInstructions} />
                </div>
            </div>
            
            <FeedbackForm />
        </div>
      </div>
    </div>
  );
}
