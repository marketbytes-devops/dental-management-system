"use client";

export default function DoctorNavbar() {
  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 shadow-sm z-10">
      <div className="flex items-center bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary w-96 transition-all">
        <span className="text-gray-400 mr-2">🔍</span>
        <input 
          type="text" 
          placeholder="Search patients, doctors, appointments..." 
          className="bg-transparent border-none outline-none text-sm w-full placeholder:text-gray-400"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-primary transition-colors">
          <span className="text-xl">🔔</span>
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger rounded-full border-2 border-white animate-pulse"></span>
        </button>
        <button className="p-2 text-gray-400 hover:text-primary transition-colors">
          <span className="text-xl">❓</span>
        </button>
        <div className="h-6 w-px bg-gray-200 mx-1"></div>
        <button className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer">
          Logout
        </button>
      </div>
    </header>
  );
}
