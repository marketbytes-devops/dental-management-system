"use client";
import React from 'react';
import { Bell, Calendar, CreditCard, ClipboardList, Info, CheckCircle, Circle, Trash2 } from 'lucide-react';

const getIcon = (type) => {
  switch (type) {
    case 'appointment':
    case 'reminders':
      return <Calendar className="w-5 h-5 text-blue-500" />;
    case 'billing':
      return <CreditCard className="w-5 h-5 text-red-500" />;
    case 'consent':
      return <ClipboardList className="w-5 h-5 text-green-500" />;
    case 'treatment_plan':
      return <Info className="w-5 h-5 text-indigo-500" />;
    case 'lab_delivery':
      return <Bell className="w-5 h-5 text-purple-500" />;
    default:
      return <Bell className="w-5 h-5 text-gray-500" />;
  }
};

export default function NotificationList({ notifications, onMarkRead, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
        {notifications.length > 0 && onMarkRead && (
          <button 
            onClick={() => onMarkRead('all')}
            className="text-xs font-bold text-primary hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>
      <div className="divide-y divide-gray-100">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No notifications to show.
          </div>
        ) : (
          notifications.map((notif) => (
            <div key={notif.id} className={`p-5 flex gap-4 transition-colors relative group ${!notif.read ? 'bg-blue-50/10 hover:bg-blue-50/20' : 'hover:bg-gray-50'}`}>
              <div className="flex-shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>
              <div className="flex-1 cursor-pointer" onClick={() => onMarkRead && !notif.read && onMarkRead(notif.id)}>
                <div className="flex justify-between items-start mb-1">
                  <h3 className={`text-sm font-semibold ${!notif.read ? 'text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </h3>
                  <span className="text-xs text-gray-450 whitespace-nowrap ml-4 mt-0.5">
                    {new Date(notif.created_at || notif.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className={`text-sm ${!notif.read ? 'text-gray-750 font-medium' : 'text-gray-500'}`}>
                  {notif.message}
                </p>
              </div>
              <div className="flex-shrink-0 flex items-center gap-3 pt-1">
                {onMarkRead && (
                  <button 
                    onClick={() => onMarkRead(notif.id)}
                    className="focus:outline-none"
                    title={notif.read ? "Mark as unread" : "Mark as read"}
                  >
                    {!notif.read ? (
                      <Circle fill="currentColor" className="w-2.5 h-2.5 text-blue-600 hover:scale-115 transition-transform" />
                    ) : (
                      <CheckCircle className="w-4 h-4 text-gray-300 hover:text-blue-500 hover:scale-105 transition-all" />
                    )}
                  </button>
                )}
                {onDelete && (
                  <button 
                    onClick={() => onDelete(notif.id)}
                    className="text-gray-300 hover:text-danger opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gray-100 focus:opacity-100 focus:outline-none"
                    title="Delete Notification"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
