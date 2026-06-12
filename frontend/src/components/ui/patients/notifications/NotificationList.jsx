"use client";
import React from 'react';
import { Bell, Calendar, CreditCard, ClipboardList, Info, CheckCircle, Circle } from 'lucide-react';

const getIcon = (type) => {
  switch (type) {
    case 'appointment': return <Calendar className="w-5 h-5 text-blue-500" />;
    case 'billing': return <CreditCard className="w-5 h-5 text-red-500" />;
    case 'post-care': return <ClipboardList className="w-5 h-5 text-green-500" />;
    case 'feedback': return <Info className="w-5 h-5 text-amber-500" />;
    default: return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

export default function NotificationList({ notifications }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50">
        <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
      </div>
      <div className="divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No notifications to show.
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className={`p-5 flex gap-4 transition-colors ${!notif.read ? 'bg-blue-50/20 hover:bg-blue-50/40' : 'hover:bg-gray-50'}`}>
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-sm font-semibold ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-4 mt-0.5">
                    {new Date(notif.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className={`text-sm ${!notif.read ? 'text-gray-700 font-medium' : 'text-gray-500'}`}>
                  {notif.message}
                </p>
                {/* Actions could go here if needed in the future */}
              </div>
              <div className="flex-shrink-0 flex items-center justify-center pt-1">
                {!notif.read ? (
                    <Circle fill="currentColor" className="w-2.5 h-2.5 text-blue-600" />
                ) : (
                    <CheckCircle className="w-4 h-4 text-gray-300" />
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
