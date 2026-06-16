"use client";
import Link from "next/link";
import { Users, Calculator } from "lucide-react";

export default function FrontDeskLandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] p-6 bg-gradient-to-br from-slate-50 to-gray-100 rounded-3xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 tracking-tight">
          Front Desk Portal
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto">
          Please select your role module to continue to your specialized dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
        {/* Receptionist Card */}
        <Link 
          href="/frontdesk/receptionist/dashboard"
          className="group relative overflow-hidden bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-2xl hover:border-blue-100 transition-all duration-500 transform hover:-translate-y-2 cursor-pointer"
        >
          {/* Background decorative icon */}
          <div className="absolute -top-6 -right-6 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-500 text-blue-600">
            <Users size={200} strokeWidth={1} />
          </div>
          
          <div className="relative z-10">
            <div className="w-16 h-16 bg-blue-50/80 text-blue-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500 shadow-sm border border-blue-100 group-hover:border-transparent">
              <Users size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
              Receptionist
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Manage patient appointments, handle daily check-ins, oversee doctor schedules, and coordinate front-desk communications smoothly.
            </p>
            
            <div className="mt-8 flex items-center text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-[-10px] group-hover:translate-x-0">
              Go to Dashboard <span className="ml-2">→</span>
            </div>
          </div>
        </Link>

        {/* Accountant Card */}
        <Link 
          href="/frontdesk/accountant/dashboard"
          className="group relative overflow-hidden bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:shadow-2xl hover:border-emerald-100 transition-all duration-500 transform hover:-translate-y-2 cursor-pointer"
        >
          {/* Background decorative icon */}
          <div className="absolute -top-6 -right-6 p-8 opacity-0 group-hover:opacity-5 transition-opacity duration-500 text-emerald-600">
            <Calculator size={200} strokeWidth={1} />
          </div>

          <div className="relative z-10">
            <div className="w-16 h-16 bg-emerald-50/80 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500 shadow-sm border border-emerald-100 group-hover:border-transparent">
              <Calculator size={32} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors duration-300">
              Accountant
            </h2>
            <p className="text-gray-500 leading-relaxed">
              Oversee financial records, manage billing operations, process claims and invoices, and track overall clinic expenses and revenue.
            </p>

            <div className="mt-8 flex items-center text-emerald-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-500 transform translate-x-[-10px] group-hover:translate-x-0">
              Go to Dashboard <span className="ml-2">→</span>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
