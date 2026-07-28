"use client";

import { Suspense } from "react";
import AdminLabModuleTabs from "@/components/features/admin/lab-module/AdminLabModuleTabs";

export default function AdminLabModulePage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-400 font-semibold">Loading Lab Module...</div>}>
      <div className="space-y-6">
        <AdminLabModuleTabs />
      </div>
    </Suspense>
  );
}
