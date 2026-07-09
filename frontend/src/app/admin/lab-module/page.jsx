"use client";

import AdminLabModuleTabs from "@/components/ui/admin/lab-module/AdminLabModuleTabs";

export default function AdminLabModulePage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-150">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Lab Module Management</h1>
          <p className="text-sm text-gray-550 mt-1 font-medium">Manage clinical lab orders, inventory valuations, and supplier networks.</p>
        </div>
      </div>
      
      <AdminLabModuleTabs />
    </div>
  );
}
