import React from 'react';
import { CalendarClock } from 'lucide-react';

export default function RecallReminderCard() {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6 shadow-sm relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute -right-6 -top-6 text-blue-500 opacity-5 pointer-events-none">
             <CalendarClock className="w-32 h-32" />
        </div>
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-5 items-center sm:items-start justify-between text-center sm:text-left">
            <div className="flex items-center gap-4 flex-col sm:flex-row">
                <div className="bg-white p-3 rounded-2xl shadow-sm border border-blue-50 text-blue-600">
                    <CalendarClock className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Time for your 6-month checkup!</h3>
                    <p className="text-sm text-gray-600 max-w-md">
                        It's been 6 months since your last visit. Regular checkups help maintain a healthy smile and catch issues early.
                    </p>
                </div>
            </div>
            <div className="mt-4 sm:mt-0 flex-shrink-0 w-full sm:w-auto">
                <button className="w-full sm:w-auto bg-primary text-white px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors font-medium shadow-sm">
                    Book Checkup Now
                </button>
            </div>
        </div>
    </div>
  );
}
